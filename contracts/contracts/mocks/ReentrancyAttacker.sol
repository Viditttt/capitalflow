// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ITokenReceiverHook} from "./HookToken.sol";

/// @notice TEST ONLY. A generic contract account that can act as supplier or financier and, when
///         armed, replays one stored call against a target the moment it receives tokens.
contract ReentrancyAttacker is ITokenReceiverHook {
    address public target;
    bytes public payload;
    bool public armed;
    bool public reentryAttempted;
    bool public reentrySucceeded;

    function arm(address target_, bytes calldata payload_) external {
        target = target_;
        payload = payload_;
        armed = true;
        reentryAttempted = false;
        reentrySucceeded = false;
    }

    function exec(address to, bytes calldata data) external returns (bytes memory) {
        (bool ok, bytes memory ret) = to.call(data);
        if (!ok) {
            assembly {
                revert(add(ret, 32), mload(ret))
            }
        }
        return ret;
    }

    function onTokenReceived() external override {
        if (!armed) return;
        armed = false;
        reentryAttempted = true;
        (bool ok, ) = target.call(payload);
        reentrySucceeded = ok;
    }
}
