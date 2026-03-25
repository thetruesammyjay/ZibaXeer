// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISidioraTradingAccount} from "../interfaces/ISidioraTradingAccount.sol";

/**
 * @title SidioraVaultAdapter
 * @dev UUPS Upgradeable Adapter for integrating CopyTrading Vaults directly 
 * into the Sidiora Perpetual Protocol. Instead of executing trades synchronously,
 * the Vault deposits margin into its Sidiora Account and delegates trading permissions
 * to the ZibaXeer off-chain matching engine / mirror bot.
 */
contract SidioraVaultAdapter is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error InvalidAmount();
    error InvalidExpiry();
    error MirrorBotNotConfigured();
    error MirrorBotUnchanged();

    event MirrorBotAddressUpdated(address indexed previousMirrorBot, address indexed newMirrorBot);
    event MirrorBotAuthorized(address indexed mirrorBot, bool canTrade, bool canWithdraw, bool canModifyMargin, uint256 expiry);
    event MirrorBotRevoked(address indexed mirrorBot);
    event MarginDeposited(address indexed token, uint256 amount);
    event MarginWithdrawn(address indexed token, uint256 amount, address indexed recipient);
    
    address public sidioraAccount;
    address public mirrorBotAddress;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the Sidiora capabilities for this Vault
     * @param initialOwner Typically the CopyTradingVault proxy
     * @param _sidioraAccount The Sidiora Trading Account created for this Vault
     * @param _mirrorBotAddress The ZibaXeer backend worker address authorized to mirror trades
     */
    function initialize(address initialOwner, address _sidioraAccount, address _mirrorBotAddress) initializer public {
        if (initialOwner == address(0) || _sidioraAccount == address(0) || _mirrorBotAddress == address(0)) {
            revert ZeroAddress();
        }

        __Ownable_init(initialOwner);
        sidioraAccount = _sidioraAccount;
        mirrorBotAddress = _mirrorBotAddress;

        emit MirrorBotAddressUpdated(address(0), _mirrorBotAddress);
    }

    /**
     * @notice Authorize the Mirror Bot to execute trades off-chain on Sidiora using the Vault's margin
     */
    function authorizeMirrorBot() external onlyOwner {
        _authorizeMirrorBot(type(uint256).max);
    }

    /**
     * @notice Authorize the configured mirror bot with a custom delegate expiry
     * @param expiry Delegate expiry timestamp
     */
    function authorizeMirrorBotWithExpiry(uint256 expiry) external onlyOwner {
        if (expiry == 0) revert InvalidExpiry();
        _authorizeMirrorBot(expiry);
    }

    /**
     * @notice Update mirror bot address without immediately re-authorizing
     * @param newMirrorBot New mirror bot address
     */
    function setMirrorBotAddress(address newMirrorBot) external onlyOwner {
        if (newMirrorBot == address(0)) revert ZeroAddress();
        if (newMirrorBot == mirrorBotAddress) revert MirrorBotUnchanged();

        address previousMirrorBot = mirrorBotAddress;
        mirrorBotAddress = newMirrorBot;
        emit MirrorBotAddressUpdated(previousMirrorBot, newMirrorBot);
    }

    /**
     * @notice Revoke current mirror bot delegation in Sidiora account
     */
    function revokeMirrorBot() public onlyOwner {
        if (mirrorBotAddress == address(0)) revert MirrorBotNotConfigured();

        ISidioraTradingAccount(sidioraAccount).removeDelegate(mirrorBotAddress);
        emit MirrorBotRevoked(mirrorBotAddress);
    }

    /**
     * @notice Rotate mirror bot address and authorize the new address in a single transaction
     * @param newMirrorBot New mirror bot address
     * @param expiry Delegate expiry timestamp
     */
    function rotateMirrorBot(address newMirrorBot, uint256 expiry) external onlyOwner {
        if (newMirrorBot == address(0)) revert ZeroAddress();
        if (newMirrorBot == mirrorBotAddress) revert MirrorBotUnchanged();
        if (expiry == 0) revert InvalidExpiry();

        if (mirrorBotAddress != address(0)) {
            ISidioraTradingAccount(sidioraAccount).removeDelegate(mirrorBotAddress);
            emit MirrorBotRevoked(mirrorBotAddress);
        }

        address previousMirrorBot = mirrorBotAddress;
        mirrorBotAddress = newMirrorBot;
        emit MirrorBotAddressUpdated(previousMirrorBot, newMirrorBot);

        _authorizeMirrorBot(expiry);
    }

    function _authorizeMirrorBot(uint256 expiry) internal {
        if (mirrorBotAddress == address(0)) revert MirrorBotNotConfigured();

        // Grand trade & modify margin permissions, but absolutely NO withdrawal rights
        ISidioraTradingAccount(sidioraAccount).addDelegate(
            mirrorBotAddress, 
            true,   // canTrade
            false,  // canWithdraw
            true,   // canModifyMargin
            expiry
        );

        emit MirrorBotAuthorized(mirrorBotAddress, true, false, true, expiry);
    }

    /**
     * @notice Deposit funds from the Vault into the Sidiora Trading Account to be used as margin
     * @param token The margin token (e.g. USDC, PAX, USDL)
     * @param amount The exact amount to deposit
     */
    function depositMargin(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        // Caller (Vault) must have already sent the funds to this adapter
        IERC20(token).forceApprove(sidioraAccount, amount);
        ISidioraTradingAccount(sidioraAccount).deposit(token, amount);
        emit MarginDeposited(token, amount);
    }
    
    /**
     * @notice Withdraw funds from the Sidiora Trading Account back to the Vault
     * @param token The margin token
     * @param amount The amount to pull back
     */
    function withdrawMargin(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        ISidioraTradingAccount(sidioraAccount).withdraw(token, amount);
        // Funds land here, transfer back to Vault
        IERC20(token).safeTransfer(msg.sender, amount);
        emit MarginWithdrawn(token, amount, msg.sender);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
