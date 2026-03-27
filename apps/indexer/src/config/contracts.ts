import { ethers, type InterfaceAbi } from 'ethers';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
const { VaultFactoryABI, CopyTradingVaultABI } = require('@zibaxeer/sdk') as {
    VaultFactoryABI: { abi: InterfaceAbi };
    CopyTradingVaultABI: { abi: InterfaceAbi };
};

const RPC_URL = process.env.HYPERPAXEER_RPC_URL || 'https://public-mainnet.rpcpaxeer.online/evm';
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
