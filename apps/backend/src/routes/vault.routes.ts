import { Router } from 'express';
import { getAllVaults, getVaultById } from '../controllers/vault.controller';

const router = Router();

// Retrieve all active ZibaXeer vaults
router.get('/', getAllVaults);

// Retrieve a specific vault by UUID or Vault Contract Address
router.get('/:id', getVaultById);

export default router;
