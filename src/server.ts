/**
 * Store Hub API Server
 * Express application entry point
 */

import express, { Express } from 'express';
import dotenv from 'dotenv';
import salesRouter from './controllers/sales-controller';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/v1', salesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Store Hub API Server              ║
║   Running on: http://localhost:${PORT}    ║
║   Environment: ${process.env.NODE_ENV || 'development'}      ║
║                                        ║
║   🔄 Using Mock In-Memory Database     ║
║   (No PostgreSQL required!)            ║
╚════════════════════════════════════════╝
  `);
  console.log('Available endpoints:');
  console.log('  POST   /v1/sales          - Create sales');
  console.log('  GET    /v1/sales          - List sales');
  console.log('  GET    /v1/sales/{id}     - Get sales');
  console.log('  PUT    /v1/sales/{id}     - Update sales');
  console.log('  GET    /health            - Health check');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
