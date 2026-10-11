import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

export const qdrantClient = new QdrantClient({
  url: env.QDRANT_URL,
  apiKey: env.QDRANT_API_KEY || undefined,
  checkCompatibility: false,
});

export async function ensureQdrantCollection(): Promise<void> {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some((c) => c.name === env.QDRANT_COLLECTION_NAME);

    if (!exists) {
      await qdrantClient.createCollection(env.QDRANT_COLLECTION_NAME, {
        vectors: {
          size: 384, // all-MiniLM-L6-v2 dimension
          distance: 'Cosine',
        },
      });
      logger.info(`✅ Qdrant collection '${env.QDRANT_COLLECTION_NAME}' created`);
    } else {
      logger.info(`✅ Qdrant collection '${env.QDRANT_COLLECTION_NAME}' is ready`);
    }
  } catch (err) {
    logger.warn('⚠️ Could not connect to Qdrant. RAG will fallback to DB text search:', err);
  }
}
