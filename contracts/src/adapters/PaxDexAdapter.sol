// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interfaces to mirror standard UniswapV2/V3 style DEX routers
interface IPaxDexRouter {
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
    
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
}

/**
 * @title PaxDexAdapter
 * @dev UUPS Upgradeable Adapter for abstracting PaxDex interactions. 
 * Allows CopyTrading vaults to transparently route tokens.
 */
contract PaxDexAdapter is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    address public paxDexRouter;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner, address _paxDexRouter) initializer public {
        __Ownable_init(initialOwner);
        paxDexRouter = _paxDexRouter;
    }

    function setPaxDexRouter(address _paxDexRouter) external onlyOwner {
        paxDexRouter = _paxDexRouter;
    }

    /**
     * @dev Executes a token swap on PaxDex
     * @param tokenIn the asset being sold
     * @param tokenOut the asset being bought
     * @param amountIn the exact amount being sold
     * @param amountOutMinimum slippage protection
     */
    function swap(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn, 
        uint256 amountOutMinimum
    ) external returns (uint256 amountOut) {
        // Vault/caller must have already transferred tokenIn here or approved this adapter
        IERC20(tokenIn).approve(paxDexRouter, amountIn);
        
        IPaxDexRouter.ExactInputSingleParams memory params = IPaxDexRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: 3000, // standard 0.3% fee tier
            recipient: msg.sender,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        return IPaxDexRouter(paxDexRouter).exactInputSingle(params);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
