// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../gov/RiskManager.sol";
import "../gov/RevenueSplitter.sol";
import "../adapters/PaxDexAdapter.sol";

/**
 * @title CopyTradingVault
 * @dev UUPS Upgradeable implementation contract mirrored by the VaultFactory.
 * Manages follower funds and executes batched signals via the PaxDex adapter.
 */
contract CopyTradingVault is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    address public leader;
    string public vaultName;
    address public baseAsset; // Token this vault trades relative to (e.g. USDC, PAX)
    
    // Dependencies
    RiskManager public riskManager;
    PaxDexAdapter public dexAdapter;
    RevenueSplitter public revenueSplitter;

    // Follower State
    struct FollowerData {
        uint256 deposited;
        uint256 waterMark; // High water mark for profit calculation
    }
    mapping(address => FollowerData) public followers;
    uint256 public totalVaultTVL;

    event TradeExecuted(address indexed tokenIn, address indexed tokenOut, uint256 totalAmountSwapped);
    event FollowerSubscribed(address indexed follower, uint256 amount);
    event FollowerUnsubscribed(address indexed follower, uint256 amount);
    event ProfitSettled(address indexed follower, uint256 profitGenerated);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializer called by VaultFactory proxy creation
     */
    function initialize(
        address _leader,
        string memory _vaultName,
        address _baseAsset,
        address _riskManager,
        address _dexAdapter,
        address _revenueSplitter
    ) initializer public {
        __Ownable_init(_leader); // Vault creator is owner of this specific proxy

        leader = _leader;
        vaultName = _vaultName;
        baseAsset = _baseAsset;
        
        riskManager = RiskManager(_riskManager);
        dexAdapter = PaxDexAdapter(_dexAdapter);
        revenueSplitter = RevenueSplitter(_revenueSplitter);
    }

    /**
     * @dev Followers deposit the baseAsset to mirror the leader
     */
    function subscribe(uint256 amount) external {
        require(amount > 0, "Invalid subscription amount");
        
        IERC20(baseAsset).safeTransferFrom(msg.sender, address(this), amount);
        
        followers[msg.sender].deposited += amount;
        followers[msg.sender].waterMark += amount;
        totalVaultTVL += amount;
        
        emit FollowerSubscribed(msg.sender, amount);
    }
    
    /**
     * @dev Followers can withdraw their stake at any time
     */
    function unsubscribe(uint256 amount) external {
        FollowerData storage data = followers[msg.sender];
        require(data.deposited >= amount, "Insufficient deposit");
        
        // Ensure no outstanding trade settlements before withdrawal
        settleFollowerProfit(msg.sender);

        data.deposited -= amount;
        totalVaultTVL -= amount;
        
        // Adjust watermark down proportionally
        data.waterMark = data.deposited;

        IERC20(baseAsset).safeTransfer(msg.sender, amount);
        emit FollowerUnsubscribed(msg.sender, amount);
    }

    /**
     * @dev Execute a mirrored trade on behalf of all vault TVL. Only the leader can call this.
     */
    function executeGroupTrade(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn,
        uint256 amountOutMinimum
    ) external onlyOwner {
        require(riskManager.validateTrade(leader), "Trade blocked by RiskManager");
        
        // Vault approves the adapter to spend the pooled funds
        IERC20(tokenIn).safeIncreaseAllowance(address(dexAdapter), amountIn);
        
        uint256 amountReceived = dexAdapter.swap(tokenIn, tokenOut, amountIn, amountOutMinimum);
        require(amountReceived >= amountOutMinimum, "Slippage exceed");
        
        emit TradeExecuted(tokenIn, tokenOut, amountIn);
    }

    /**
     * @dev Settles realized PnL against the high water mark for a specific follower.
     * Can be invoked after cycle closures. Submits profit to RevenueSplitter.
     */
    function settleFollowerProfit(address follower) public {
        FollowerData storage data = followers[follower];
        
        // PnL calculation placeholder based on current snapshot of vault value relative to their share
        uint256 currentShareValue = _calculateCurrentShareValue(data.deposited);
        
        if (currentShareValue > data.waterMark) {
            uint256 realizedProfit = currentShareValue - data.waterMark;
            
            // Approve the splitter to pull the profit amount
            IERC20(baseAsset).safeIncreaseAllowance(address(revenueSplitter), realizedProfit);
            
            // Deduct the leader/protocol cuts
            uint256 followerRemaining = revenueSplitter.splitProfit(baseAsset, realizedProfit, leader);
            
            // Auto compound remaining profit or send directly to the follower
            IERC20(baseAsset).safeTransfer(follower, followerRemaining);
            
            // Reset watermark
            data.waterMark = currentShareValue - (realizedProfit - followerRemaining);
            
            emit ProfitSettled(follower, realizedProfit);
        }
    }

    /**
     * @dev Helper to value a follower's slice of the pie based on totalVaultTVL 
     * plus active asset prices on the Dex. Note: Simplified base asset return.
     */
    function _calculateCurrentShareValue(uint256 underlyingDeposit) internal pure returns (uint256) {
        // In a production oracle environment, this would evaluate the current value of
        // all open position tokens mapping back to `baseAsset`.
        // Placeholder returning the raw deposit.
        return underlyingDeposit;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
