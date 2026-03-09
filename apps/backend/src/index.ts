import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vaultRoutes from './routes/vault.routes';
import analyticsRoutes from './routes/analytics.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import './workers/index';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/vaults', vaultRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Zibaxeer API Server'
    });
});

app.listen(port, () => {
    console.log(`[Backend] ZibaXeer API Server running on http://localhost:${port}`);
});
