import { Router } from 'express';
import { getGlobalAnalytics, getVaultAnalytics } from '../controllers/analytics.controller';

const router = Router();

// Retrieve global protocol analytics
router.get('/global', getGlobalAnalytics);

// Retrieve analytics for a specific vault
router.get('/vault/:id', getVaultAnalytics);

export default router;
