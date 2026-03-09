import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller';

const router = Router();

// Retrieve the global ranking of Vault Leaders
router.get('/', getLeaderboard);

export default router;
