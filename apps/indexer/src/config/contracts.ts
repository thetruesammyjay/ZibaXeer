import { ethers } from 'ethers';
import VaultFactoryABI from '../abis/VaultFactory.json';
import CopyTradingVaultABI from '../abis/CopyTradingVault.json';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.HYPERPAXEER_RPC_URL || 'https://mainnet-beta.rpc.hyperpaxeer.com/rpc';
const VAULT_FACTORY_ADDRESS = process.env.VAULT_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000';

export const provider = new ethers.JsonRpcProvider(RPC_URL);

/**
 * Returns an instantiated ethers Contract for the Vault Factory
 */
export const getVaultFactoryContract = () => {
    return new ethers.Contract(VAULT_FACTORY_ADDRESS, VaultFactoryABI.abi, provider);
};

/**
 * Returns an instantiated ethers Contract for a specific CopyTrading Vault
 */
export const getVaultContract = (vaultAddress: string) => {
    return new ethers.Contract(vaultAddress, CopyTradingVaultABI.abi, provider);
};
