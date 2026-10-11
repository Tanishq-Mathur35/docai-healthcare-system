import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { ensureBucketExists } from './config/storage';
import { ensureQdrantCollection } from './modules/ai/rag/qdrant.client';
import { setupSocketIO } from './socket';
import { logger } from './config/logger';

async function bootstrap(): Promise<void> {
  try {
    // Connect services
    await connectDatabase();
    await connectRedis();
    await ensureBucketExists();
    await ensureQdrantCollection();

    const httpServer = createServer(app);

    // Initialize Socket.IO real-time server
    const io = setupSocketIO(httpServer);

    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`📡 REST API: http://localhost:${env.PORT}/api/${env.API_VERSION}`);
      logger.info(`⚡ Socket.IO listening on ws://localhost:${env.PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      io.close();
      httpServer.close(async () => {
        await disconnectDatabase();
        logger.info('Server shut down cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      process.exit(1);
    });
  } catch (err) {
    logger.error('Bootstrap failed:', err);
    process.exit(1);
  }
}

bootstrap();
