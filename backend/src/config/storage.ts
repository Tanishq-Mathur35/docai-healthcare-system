import * as Minio from 'minio';
import { env } from './env';
import { logger } from './logger';

const url = new URL(env.STORAGE_ENDPOINT);

export const minioClient = new Minio.Client({
  endPoint: url.hostname,
  port: parseInt(url.port || (url.protocol === 'https:' ? '443' : '9000')),
  useSSL: url.protocol === 'https:',
  accessKey: env.STORAGE_ACCESS_KEY,
  secretKey: env.STORAGE_SECRET_KEY,
});

export async function ensureBucketExists(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(env.STORAGE_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(env.STORAGE_BUCKET, env.STORAGE_REGION);
      logger.info(`✅ Storage bucket '${env.STORAGE_BUCKET}' created`);
    } else {
      logger.info(`✅ Storage bucket '${env.STORAGE_BUCKET}' ready`);
    }
  } catch (err) {
    logger.warn(`⚠️ Storage service unreachable at ${env.STORAGE_ENDPOINT}: ${(err as Error).message}. File uploads will require MinIO or S3 to be active.`);
  }
}
