/**
 * Fusion 360 CAD Copilot - Backend API
 * Simple Express server for Fusion 360 integration
 *
 * This is a standalone server, separate from the existing AWS hackathon backend.
 * Run with: node backend-fusion.js
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fusionRoutes from './routes/fusion.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: '*',  // Allow all origins (Fusion 360 add-in needs this)
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/fusion', fusionRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Fusion 360 CAD Copilot Backend',
        timestamp: new Date().toISOString(),
        env: {
            hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
            nodeVersion: process.version
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Fusion 360 CAD Copilot API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            generate: 'POST /api/fusion/generate',
            refine: 'POST /api/fusion/refine',
            fusionHealth: 'GET /api/fusion/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  🚀 Fusion 360 CAD Copilot Backend');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log(`  Server:     http://localhost:${PORT}`);
    console.log(`  Health:     http://localhost:${PORT}/health`);
    console.log(`  API:        http://localhost:${PORT}/api/fusion`);
    console.log('');
    console.log('  Status:');
    console.log(`    ✅ Express running`);
    console.log(`    ${process.env.ANTHROPIC_API_KEY ? '✅' : '❌'} Anthropic API key ${process.env.ANTHROPIC_API_KEY ? 'loaded' : 'MISSING!'}`);
    console.log('');
    if (!process.env.ANTHROPIC_API_KEY) {
        console.log('  ⚠️  WARNING: ANTHROPIC_API_KEY not set!');
        console.log('     Add it to backend/.env file');
        console.log('');
    }
    console.log('  Ready for Fusion 360 add-in connections! 🎉');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Shutting down gracefully...');
    process.exit(0);
});
