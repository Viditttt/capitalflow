// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IInvoiceRegistry} from "./interfaces/IInvoiceRegistry.sol";

/// @title InvoiceRegistry
/// @notice Records invoice commitments and their verification status.
/// @dev IMPORTANT: this contract records what suppliers claim and what an authorised verifier
///      attested. It cannot prove an invoice is genuine, that the buyer will pay, or that goods
///      were delivered. Those require off-chain verification and controls.
///
///      Critical invoice fields (supplier, face value, dates, hashes) are written once at
///      registration and there is no function that modifies them afterwards.
///
///      Roles:
///        DEFAULT_ADMIN_ROLE  grants roles, resolves flags and disputes, pauses registration
///        VERIFIER_ROLE       approves, rejects or flags submitted invoices
///        MARKETPLACE_ROLE    the FinancingMarketplace contract; moves invoices to Financed/Settled
contract InvoiceRegistry is IInvoiceRegistry, AccessControl, Pausable {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant MARKETPLACE_ROLE = keccak256("MARKETPLACE_ROLE");

    uint256 public constant MAX_FACE_VALUE = 1_000_000_000 * 1e6; // sanity ceiling
    uint256 public constant MAX_TERM = 365 days; // max issue-to-due period

    uint256 public invoiceCount;
    mapping(uint256 invoiceId => Invoice) private _invoices;
    mapping(bytes32 invoiceKey => uint256 invoiceId) public idByInvoiceKey;
    mapping(bytes32 documentHash => uint256 invoiceId) public idByDocumentHash;

    event InvoiceRegistered(
        uint256 indexed invoiceId,
        address indexed supplier,
        bytes32 invoiceKey,
        uint256 faceValue,
        uint64 issueDate,
        uint64 dueDate,
        bytes32 documentHash
    );
    event InvoiceVerified(uint256 indexed invoiceId, address indexed verifier);
    event InvoiceRejected(uint256 indexed invoiceId, address indexed by, bytes32 reasonHash);
    event InvoiceFlagged(uint256 indexed invoiceId, address indexed by, bytes32 reasonHash);
    event FlagResolved(uint256 indexed invoiceId, address indexed admin, Status newStatus, bytes32 reasonHash);
    event InvoiceFinanced(uint256 indexed invoiceId);
    event InvoiceSettled(uint256 indexed invoiceId);
    event DisputeOpened(uint256 indexed invoiceId, address indexed admin, bytes32 reasonHash);
    event DisputeResolved(uint256 indexed invoiceId, address indexed admin, bytes32 reasonHash);

    error ZeroHash();
    error InvalidFaceValue();
    error IssueDateInFuture();
    error InvalidDueDate();
    error TermTooLong();
    error DuplicateInvoiceKey(uint256 existingInvoiceId);
    error DuplicateDocumentHash(uint256 existingInvoiceId);
    error InvoiceNotFound(uint256 invoiceId);
    error InvalidStatus(Status current);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ------------------------------------------------------------------ supplier

    /// @notice Register an invoice. The caller becomes the supplier of record.
    /// @param invoiceKey keccak256 of the off-chain invoice identifier (e.g. buyer + invoice number)
    /// @param faceValue invoice amount in token base units
    /// @param issueDate invoice issue date (unix seconds, must not be in the future)
    /// @param dueDate invoice due date (unix seconds, must be in the future)
    /// @param documentHash hash of the supporting document; the document itself stays off-chain
    function registerInvoice(
        bytes32 invoiceKey,
        uint256 faceValue,
        uint64 issueDate,
        uint64 dueDate,
        bytes32 documentHash
    ) external whenNotPaused returns (uint256 invoiceId) {
        if (invoiceKey == bytes32(0) || documentHash == bytes32(0)) revert ZeroHash();
        if (faceValue == 0 || faceValue > MAX_FACE_VALUE) revert InvalidFaceValue();
        if (issueDate > block.timestamp) revert IssueDateInFuture();
        if (dueDate <= issueDate || dueDate <= block.timestamp) revert InvalidDueDate();
        if (dueDate - issueDate > MAX_TERM) revert TermTooLong();

        uint256 existing = idByInvoiceKey[invoiceKey];
        if (existing != 0) revert DuplicateInvoiceKey(existing);
        existing = idByDocumentHash[documentHash];
        if (existing != 0) revert DuplicateDocumentHash(existing);

        invoiceId = ++invoiceCount;
        _invoices[invoiceId] = Invoice({
            supplier: msg.sender,
            faceValue: faceValue,
            issueDate: issueDate,
            dueDate: dueDate,
            invoiceKey: invoiceKey,
            documentHash: documentHash,
            status: Status.Submitted
        });
        idByInvoiceKey[invoiceKey] = invoiceId;
        idByDocumentHash[documentHash] = invoiceId;

        emit InvoiceRegistered(invoiceId, msg.sender, invoiceKey, faceValue, issueDate, dueDate, documentHash);
    }

    // ------------------------------------------------------------------ verifier

    function verifyInvoice(uint256 invoiceId) external onlyRole(VERIFIER_ROLE) {
        Invoice storage inv = _existing(invoiceId);
        if (inv.status != Status.Submitted) revert InvalidStatus(inv.status);
        inv.status = Status.Verified;
        emit InvoiceVerified(invoiceId, msg.sender);
    }

    /// @param reasonHash hash of the off-chain rejection reason (reason text is stored off-chain)
    function rejectInvoice(uint256 invoiceId, bytes32 reasonHash) external onlyRole(VERIFIER_ROLE) {
        Invoice storage inv = _existing(invoiceId);
        if (inv.status != Status.Submitted) revert InvalidStatus(inv.status);
        inv.status = Status.Rejected;
        emit InvoiceRejected(invoiceId, msg.sender, reasonHash);
    }

    /// @notice Flag a submitted or verified invoice (e.g. suspected duplicate). Blocks acceptance of offers.
    function flagInvoice(uint256 invoiceId, bytes32 reasonHash) external onlyRole(VERIFIER_ROLE) {
        Invoice storage inv = _existing(invoiceId);
        if (inv.status != Status.Submitted && inv.status != Status.Verified) revert InvalidStatus(inv.status);
        inv.status = Status.Flagged;
        emit InvoiceFlagged(invoiceId, msg.sender, reasonHash);
    }

    // ------------------------------------------------------------------ admin

    /// @notice Resolve a flag. The invoice either returns to the verifier queue (Submitted)
    ///         or is rejected. An admin cannot mark it Verified directly, so a flag can never
    ///         be used to bypass verification.
    function resolveFlag(uint256 invoiceId, bool reReview, bytes32 reasonHash) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Invoice storage inv = _existing(invoiceId);
        if (inv.status != Status.Flagged) revert InvalidStatus(inv.status);
        inv.status = reReview ? Status.Submitted : Status.Rejected;
        emit FlagResolved(invoiceId, msg.sender, inv.status, reasonHash);
    }

    /// @notice Record a dispute on a financed invoice. Repayment is still possible while disputed.
    function openDispute(uint256 invoiceId, bytes32 reasonHash) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Invoice storage inv = _existing(invoiceId);
        if (inv.status != Status.Financed) revert InvalidStatus(inv.status);
        inv.status = Status.Disputed;
        emit DisputeOpened(invoiceId, msg.sender, reasonHash);
    }

    function resolveDispute(uint256 invoiceId, bytes32 reasonHash) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Invoice storage inv = _existing(invoiceId);
        if (inv.status != Status.Disputed) revert InvalidStatus(inv.status);
        inv.status = Status.Financed;
        emit DisputeResolved(invoiceId, msg.sender, reasonHash);
    }

    /// @notice Pause new invoice registration only. Verification, financing state changes and
    ///         settlement are unaffected, so existing positions are never trapped.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ------------------------------------------------------------------ marketplace hooks

    function markFinanced(uint256 invoiceId) external onlyRole(MARKETPLACE_ROLE) {
        Invoice storage inv = _existing(invoiceId);
        if (inv.status != Status.Verified) revert InvalidStatus(inv.status);
        inv.status = Status.Financed;
        emit InvoiceFinanced(invoiceId);
    }

    function markSettled(uint256 invoiceId) external onlyRole(MARKETPLACE_ROLE) {
        Invoice storage inv = _existing(invoiceId);
        if (inv.status != Status.Financed && inv.status != Status.Disputed) revert InvalidStatus(inv.status);
        inv.status = Status.Settled;
        emit InvoiceSettled(invoiceId);
    }

    // ------------------------------------------------------------------ views

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        Invoice memory inv = _invoices[invoiceId];
        if (inv.status == Status.None) revert InvoiceNotFound(invoiceId);
        return inv;
    }

    /// @notice True if the invoice is verified and not yet past its due date.
    function isEligible(uint256 invoiceId) external view returns (bool) {
        Invoice storage inv = _invoices[invoiceId];
        return inv.status == Status.Verified && inv.dueDate > block.timestamp;
    }

    function _existing(uint256 invoiceId) private view returns (Invoice storage inv) {
        inv = _invoices[invoiceId];
        if (inv.status == Status.None) revert InvoiceNotFound(invoiceId);
    }
}
