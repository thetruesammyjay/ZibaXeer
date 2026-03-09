// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RevenueSplitter
 * @dev UUPS Upgradeable contract responsible for profit calculations.
 * Divides realized PnL between leaders, followers, and the protocol treasury.
 */
contract RevenueSplitter is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    address public protocolTreasury;
    
    // Default splits in basis points (10000 = 100%)
    uint256 public leaderShareBps;
    uint256 public protocolFeeBps;

    event ProfitSplit(
        address indexed vault,
        address indexed token,
        uint256 totalProfit,
        uint256 leaderCut,
        uint256 protocolCut,
        uint256 followerRemaining
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner, 
        address _treasury,
        uint256 _leaderShare,
        uint256 _protocolFee
    ) initializer public {
        __Ownable_init(initialOwner);
        
        protocolTreasury = _treasury;
        leaderShareBps = _leaderShare;
        protocolFeeBps = _protocolFee;
        
        require(_leaderShare + _protocolFee <= 10000, "Invalid split");
    }

    /**
     * @dev Processes the PnL split for a given token
     * Called by the CopyTradingVault when a profitable cycle closes.
     */
    function splitProfit(
        address token,
        uint256 totalProfit,
        address leaderAddress
    ) external returns (uint256 followerRemaining) {
        // Assume the vault has given this contract allowance or transferred the profit
        
        uint256 leaderCut = (totalProfit * leaderShareBps) / 10000;
        uint256 protocolCut = (totalProfit * protocolFeeBps) / 10000;
        followerRemaining = totalProfit - leaderCut - protocolCut;

        if (leaderCut > 0) {
            IERC20(token).safeTransferFrom(msg.sender, leaderAddress, leaderCut);
        }
        
        if (protocolCut > 0) {
            IERC20(token).safeTransferFrom(msg.sender, protocolTreasury, protocolCut);
        }

        emit ProfitSplit(msg.sender, token, totalProfit, leaderCut, protocolCut, followerRemaining);
        
        return followerRemaining; // Return to the vault to update follower's running balance
    }

    function setShares(uint256 _leaderShare, uint256 _protocolFee) external onlyOwner {
        require(_leaderShare + _protocolFee <= 10000, "Invalid split");
        leaderShareBps = _leaderShare;
        protocolFeeBps = _protocolFee;
    }

    function setTreasury(address _treasury) external onlyOwner {
        protocolTreasury = _treasury;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
