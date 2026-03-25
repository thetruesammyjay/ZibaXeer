// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ISidioraTradingAccount
/// @notice Minimal interface for standard interacting with a Sidiora per-user trading account
interface ISidioraTradingAccount {
    /// @notice Deposit stablecoins into the account
    function deposit(address _token, uint256 _amount) external;

    /// @notice Withdraw stablecoins from the account
    function withdraw(address _token, uint256 _amount) external;

    /// @notice Add an authorized delegate to perform off-chain batch trades
    function addDelegate(
        address _delegate,
        bool _canTrade,
        bool _canWithdraw,
        bool _canModifyMargin,
        uint256 _expiry
    ) external;

    /// @notice Remove a delegate
    function removeDelegate(address _delegate) external;
}
