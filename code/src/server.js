/**
 * Server Entry Point
 *
 * Starts the Express server and handles graceful shutdown
 */

// code/src/server.js

import { createApp } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma } from './lib/prisma.js';

const app = createApp();

/**
 * Start the server
 */
const server = app.listen(env.PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🚀 HTMX Server running successfully!    ║
║                                           ║
║   Environment: ${env.NODE_ENV.padEnd(27)}║
║   Port:        ${String(env.PORT).padEnd(27)}║
║   URL:         http://localhost:${env.PORT.toString().padEnd(10)}║
║                                           ║
╚═══════════════════════════════════════════╝
  `);
});

/**
 * Graceful shutdown handler
 * @param {string} signal
 * @returns {Promise<void>}
 */
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('HTTP server closed');

    try {
      await disconnectPrisma();
      console.log('Database connections closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

/**
 * Handle shutdown signals
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Handle uncaught errors
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});
