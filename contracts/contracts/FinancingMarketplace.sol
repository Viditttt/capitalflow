// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IInvoiceRegistry} from "./interfaces/IInvoiceRegistry.sol";

/// @title FinancingMarketplace
/// @notice DEMO ONLY. Offers, escrow, funding and simulated settlement for invoice financing
///         using a worthless test token. Not an audited production contract. Not a licensed
///         lending platform.
///
/// Economics (all integer maths, token base units):
///   advance principal  = amount the financier escrows and the supplier receives (before service fee)
///   financing fee      = amount owed to the financier on top of principal
///   total due          = principal + financing fee           (paid to the financier at settlement)
///   service fee        = principal * serviceFeeBps / 10_000  (paid to the treasury at acceptance,
///                        deducted from the supplier's advance; this is the platform's revenue)
///   supplier advance   = principal - service fee
///   settlement         = the (simulated) buyer pays the full invoice face value; the financier
///                        receives total due and the supplier receives the remainder.
///
/// Offer lifecycle:  Open -> Accepted | Cancelled | Expired | Voided
/// Funds in an Open offer are refundable at all times through cancelOffer (financier) or reclaim
/// (anyone, once expired or once the invoice is no longer Verified). Refunds are pull-based per
/// offer, so one failing transfer can never block other users.
///
/// Pausing blocks only new offers and new acceptances. Cancel, reclaim and repay always work.
/// The admin has no function that can move escrowed funds.
contract FinancingMarketplace is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant FINANCIER_ROLE = keccak256("FINANCIER_ROLE");
    bytes32 public constant DEMO_PAYER_ROLE = keccak256("DEMO_PAYER_ROLE");

    uint256 public constant BPS = 10_000;
    uint256 public constant MIN_OFFER_VALIDITY = 1 hours;
    uint256 public constant MAX_OFFER_VALIDITY = 30 days;
    uint256 public constant MAX_ADVANCE_BPS_CEILING = 9_500; // admin can never set above 95%
    uint256 public constant MAX_SERVICE_FEE_BPS_CEILING = 500; // admin can never set above 5%
    uint256 public constant DAYS_IN_YEAR = 365; // annualisation convention: simple, actual/365

    enum OfferStatus {
        None,
        Open,
        Accepted,
        Cancelled,
        Expired,
        Voided
    }
    enum FinancingStatus {
        None,
        Active,
        Settled
    }

    struct Offer {
        uint256 invoiceId;
        address financier;
        uint256 principal;
        uint256 fee;
        uint64 expiry;
        OfferStatus status;
    }

    struct Financing {
        uint256 invoiceId;
        address supplier;
        address financier;
        uint256 principal;
        uint256 fee;
        uint256 serviceFee;
        uint256 totalDue;
        uint64 fundedAt;
        uint64 maturity; // equals the invoice due date
        uint64 settledAt;
        FinancingStatus status;
    }

    IERC20 public immutable token;
    IInvoiceRegistry public immutable registry;

    address public treasury;
    uint256 public maxAdvanceBps = 9_000; // financing limit: principal <= 90% of face value
    uint256 public serviceFeeBps = 50; // 0.50% of principal, platform revenue

    uint256 public offerCount;
    mapping(uint256 offerId => Offer) private _offers;
    /// @dev A financing shares the id of the offer that created it.
    mapping(uint256 offerId => Financing) private _financings;
    mapping(uint256 invoiceId => uint256 offerId) public financingOfInvoice;

    event OfferSubmitted(
        uint256 indexed offerId,
        uint256 indexed invoiceId,
        address indexed financier,
        uint256 principal,
        uint256 fee,
        uint64 expiry
    );
    event OfferCancelled(uint256 indexed offerId, address indexed financier, uint256 refunded);
    event OfferReclaimed(uint256 indexed offerId, address indexed financier, OfferStatus finalStatus, uint256 refunded);
    event OfferAccepted(
        uint256 indexed offerId,
        uint256 indexed invoiceId,
        address indexed supplier,
        address financier,
        uint256 principal,
        uint256 serviceFee,
        uint256 advancePaidToSupplier,
        uint256 totalDue,
        uint64 maturity
    );
    event FinancingSettled(
        uint256 indexed offerId,
        uint256 indexed invoiceId,
        address indexed payer,
        uint256 paidToFinancier,
        uint256 paidToSupplier
    );
    event TreasuryUpdated(address treasury);
    event MaxAdvanceBpsUpdated(uint256 bps);
    event ServiceFeeBpsUpdated(uint256 bps);

    error ZeroAddress();
    error ZeroPrincipal();
    error ZeroFee();
    error InvoiceNotVerified();
    error InvoiceMatured();
    error PrincipalExceedsLimit(uint256 principal, uint256 limit);
    error TotalDueExceedsFaceValue(uint256 totalDue, uint256 faceValue);
    error InvalidValidity();
    error OfferOutlivesInvoice();
    error OfferNotOpen();
    error OfferExpired();
    error OfferStillActive();
    error NotOfferFinancier();
    error NotInvoiceSupplier();
    error FinancingNotActive();
    error InvalidSettlementAmount(uint256 provided, uint256 required);
    error BpsTooHigh(uint256 provided, uint256 ceiling);
    error ZeroDuration();

    constructor(IERC20 token_, IInvoiceRegistry registry_, address treasury_, address admin) {
        if (address(token_) == address(0) || address(registry_) == address(0)) revert ZeroAddress();
        if (treasury_ == address(0) || admin == address(0)) revert ZeroAddress();
        token = token_;
        registry = registry_;
        treasury = treasury_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ------------------------------------------------------------------ financier

    /// @notice Submit a financing offer for a verified invoice and escrow the principal.
    /// @dev The financier must first approve this contract for at least `principal` tokens.
    /// @param validity seconds from now until the offer expires
    function submitOffer(
        uint256 invoiceId,
        uint256 principal,
        uint256 fee,
        uint64 validity
    ) external onlyRole(FINANCIER_ROLE) whenNotPaused nonReentrant returns (uint256 offerId) {
        IInvoiceRegistry.Invoice memory inv = registry.getInvoice(invoiceId);
        if (inv.status != IInvoiceRegistry.Status.Verified) revert InvoiceNotVerified();
        if (inv.dueDate <= block.timestamp) revert InvoiceMatured();

        if (principal == 0) revert ZeroPrincipal();
        if (fee == 0) revert ZeroFee();
        uint256 limit = maxPrincipalFor(inv.faceValue);
        if (principal > limit) revert PrincipalExceedsLimit(principal, limit);
        if (principal + fee > inv.faceValue) revert TotalDueExceedsFaceValue(principal + fee, inv.faceValue);

        if (validity < MIN_OFFER_VALIDITY || validity > MAX_OFFER_VALIDITY) revert InvalidValidity();
        uint64 expiry = uint64(block.timestamp) + validity;
        if (expiry >= inv.dueDate) revert OfferOutlivesInvoice();

        offerId = ++offerCount;
        _offers[offerId] = Offer({
            invoiceId: invoiceId,
            financier: msg.sender,
            principal: principal,
            fee: fee,
            expiry: expiry,
            status: OfferStatus.Open
        });

        // Interaction last. Reverts with the token's own error on insufficient balance/allowance.
        token.safeTransferFrom(msg.sender, address(this), principal);

        emit OfferSubmitted(offerId, invoiceId, msg.sender, principal, fee, expiry);
    }

    /// @notice Financier withdraws an Open offer and receives the escrowed principal back.
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage o = _offers[offerId];
        if (o.status != OfferStatus.Open) revert OfferNotOpen();
        if (msg.sender != o.financier) revert NotOfferFinancier();

        o.status = OfferStatus.Cancelled; // effects before interaction
        token.safeTransfer(o.financier, o.principal);
        emit OfferCancelled(offerId, o.financier, o.principal);
    }

    /// @notice Return escrowed principal of an Open offer to its financier when the offer can no
    ///         longer be accepted: it has expired, or its invoice is no longer Verified (financed
    ///         by another offer, rejected, flagged...). Callable by anyone; funds always go to the
    ///         financier. Intentionally not pausable.
    function reclaim(uint256 offerId) external nonReentrant {
        Offer storage o = _offers[offerId];
        if (o.status != OfferStatus.Open) revert OfferNotOpen();

        bool expired = block.timestamp >= o.expiry;
        if (!expired) {
            IInvoiceRegistry.Status s = registry.getInvoice(o.invoiceId).status;
            if (s == IInvoiceRegistry.Status.Verified) revert OfferStillActive();
        }

        o.status = expired ? OfferStatus.Expired : OfferStatus.Voided;
        token.safeTransfer(o.financier, o.principal);
        emit OfferReclaimed(offerId, o.financier, o.status, o.principal);
    }

    // ------------------------------------------------------------------ supplier

    /// @notice Supplier accepts one Open offer. The invoice moves to Financed, which makes every
    ///         other offer on the invoice non-acceptable (and refundable via reclaim).
    function acceptOffer(uint256 offerId) external whenNotPaused nonReentrant {
        Offer storage o = _offers[offerId];
        if (o.status != OfferStatus.Open) revert OfferNotOpen();
        if (block.timestamp >= o.expiry) revert OfferExpired();

        IInvoiceRegistry.Invoice memory inv = registry.getInvoice(o.invoiceId);
        if (msg.sender != inv.supplier) revert NotInvoiceSupplier();
        if (inv.status != IInvoiceRegistry.Status.Verified) revert InvoiceNotVerified();
        if (inv.dueDate <= block.timestamp) revert InvoiceMatured();

        uint256 principal = o.principal;
        uint256 serviceFee = (principal * serviceFeeBps) / BPS;
        uint256 advance = principal - serviceFee;
        uint256 totalDue = principal + o.fee;

        // Effects
        o.status = OfferStatus.Accepted;
        financingOfInvoice[o.invoiceId] = offerId;
        _financings[offerId] = Financing({
            invoiceId: o.invoiceId,
            supplier: inv.supplier,
            financier: o.financier,
            principal: principal,
            fee: o.fee,
            serviceFee: serviceFee,
            totalDue: totalDue,
            fundedAt: uint64(block.timestamp),
            maturity: inv.dueDate,
            settledAt: 0,
            status: FinancingStatus.Active
        });
        registry.markFinanced(o.invoiceId); // trusted contract; reverts unless invoice is Verified

        // Interactions
        if (serviceFee > 0) token.safeTransfer(treasury, serviceFee);
        token.safeTransfer(inv.supplier, advance);

        emit OfferAccepted(offerId, o.invoiceId, inv.supplier, o.financier, principal, serviceFee, advance, totalDue, inv.dueDate);
    }

    // ------------------------------------------------------------------ settlement (demo)

    /// @notice SIMULATED buyer payment. A DEMO_PAYER pays the full invoice face value; the contract
    ///         pays the financier `totalDue` and the supplier the remainder. This does not and
    ///         cannot verify any real-world payment by a real buyer.
    /// @dev The payer must approve this contract for `amount` first. Works after the due date
    ///      (overdue) and while an invoice is Disputed. Intentionally not pausable.
    function repay(uint256 offerId, uint256 amount) external onlyRole(DEMO_PAYER_ROLE) nonReentrant {
        Financing storage f = _financings[offerId];
        if (f.status != FinancingStatus.Active) revert FinancingNotActive();

        uint256 required = registry.getInvoice(f.invoiceId).faceValue;
        if (amount != required) revert InvalidSettlementAmount(amount, required);

        // Effects
        f.status = FinancingStatus.Settled;
        f.settledAt = uint64(block.timestamp);
        registry.markSettled(f.invoiceId);

        uint256 toSupplier = amount - f.totalDue; // totalDue <= faceValue is enforced at offer time

        // Interactions
        token.safeTransferFrom(msg.sender, f.financier, f.totalDue);
        if (toSupplier > 0) token.safeTransferFrom(msg.sender, f.supplier, toSupplier);

        emit FinancingSettled(offerId, f.invoiceId, msg.sender, f.totalDue, toSupplier);
    }

    // ------------------------------------------------------------------ admin

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newTreasury == address(0)) revert ZeroAddress();
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function setMaxAdvanceBps(uint256 bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bps > MAX_ADVANCE_BPS_CEILING) revert BpsTooHigh(bps, MAX_ADVANCE_BPS_CEILING);
        maxAdvanceBps = bps;
        emit MaxAdvanceBpsUpdated(bps);
    }

    function setServiceFeeBps(uint256 bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bps > MAX_SERVICE_FEE_BPS_CEILING) revert BpsTooHigh(bps, MAX_SERVICE_FEE_BPS_CEILING);
        serviceFeeBps = bps;
        emit ServiceFeeBpsUpdated(bps);
    }

    // ------------------------------------------------------------------ views

    function getOffer(uint256 offerId) external view returns (Offer memory) {
        return _offers[offerId];
    }

    function getFinancing(uint256 offerId) external view returns (Financing memory) {
        return _financings[offerId];
    }

    /// @notice Largest principal an offer may carry for a given invoice face value.
    function maxPrincipalFor(uint256 faceValue) public view returns (uint256) {
        return (faceValue * maxAdvanceBps) / BPS;
    }

    function isOverdue(uint256 offerId) external view returns (bool) {
        Financing storage f = _financings[offerId];
        return f.status == FinancingStatus.Active && block.timestamp > f.maturity;
    }

    /// @notice Implied annualised financing cost in basis points. Simple (non-compounded),
    ///         actual/365: fee / principal * 365 days / duration. Integer division truncates.
    function impliedAnnualisedBps(uint256 principal, uint256 fee, uint256 durationSeconds) public pure returns (uint256) {
        if (principal == 0) revert ZeroPrincipal();
        if (durationSeconds == 0) revert ZeroDuration();
        return (fee * DAYS_IN_YEAR * 1 days * BPS) / (principal * durationSeconds);
    }
}
