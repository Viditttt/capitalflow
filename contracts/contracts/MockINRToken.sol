// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockINRToken
/// @notice DEMO ONLY. A worthless test token used to simulate INR-denominated financing.
///         1 token (1e6 base units) represents Rs 1 in the business-model assumptions.
///         It is not a stablecoin, not redeemable, and has no real-world value.
contract MockINRToken is ERC20, Ownable {
    uint256 public constant FAUCET_AMOUNT = 5_000_000 * 1e6; // Rs 50,00,000 of test tokens
    uint256 public constant FAUCET_COOLDOWN = 1 days;

    mapping(address account => uint256 timestamp) public lastFaucetAt;

    error FaucetCooldown(uint256 availableAt);

    constructor(address initialOwner) ERC20("Mock INR (Demo)", "mINR") Ownable(initialOwner) {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Anyone can claim test tokens once per cooldown period.
    function faucet() external {
        uint256 last = lastFaucetAt[msg.sender];
        if (last != 0 && block.timestamp < last + FAUCET_COOLDOWN) {
            revert FaucetCooldown(last + FAUCET_COOLDOWN);
        }
        lastFaucetAt[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice Owner-only mint for seeding demo accounts.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
