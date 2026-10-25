// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface ITokenReceiverHook {
    function onTokenReceived() external;
}

/// @notice TEST ONLY. An ERC-20 that calls back into receiving contracts (like ERC-777 hooks) so
///         tests can attempt reentrancy against the marketplace. Never deploy outside tests.
contract HookToken is ERC20 {
    constructor() ERC20("Hook Token", "HOOK") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
        if (to.code.length > 0) {
            try ITokenReceiverHook(to).onTokenReceived() {} catch {}
        }
    }
}
