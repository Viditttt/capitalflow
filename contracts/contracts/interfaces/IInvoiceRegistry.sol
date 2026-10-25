// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Interface used by FinancingMarketplace to read and advance invoice state.
interface IInvoiceRegistry {
    enum Status {
        None, // 0: does not exist
        Submitted, // 1: registered, waiting for a verifier
        Verified, // 2: verifier attested; eligible for offers
        Rejected, // 3: verifier or admin rejected
        Flagged, // 4: suspicious or duplicate; blocked pending admin resolution
        Financed, // 5: an offer was accepted and the advance was paid
        Settled, // 6: demo repayment completed
        Disputed // 7: admin marked a financed invoice as disputed
    }

    struct Invoice {
        address supplier;
        uint256 faceValue; // token base units (6 decimals)
        uint64 issueDate; // unix seconds
        uint64 dueDate; // unix seconds
        bytes32 invoiceKey; // keccak256 of the off-chain invoice identifier
        bytes32 documentHash; // SHA-256 / keccak256 of the supporting document
        Status status;
    }

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory);

    function markFinanced(uint256 invoiceId) external;

    function markSettled(uint256 invoiceId) external;
}
