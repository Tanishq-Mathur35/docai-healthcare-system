import { minioClient } from '../config/storage';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export function generateStorageKey(patientId: string, originalName: string, folder = 'documents'): string {
  const ext = path.extname(originalName);
  return `${folder}/${patientId}/${uuidv4()}${ext}`;
}

export async function uploadFile(
  buffer: Buffer,
  storageKey: string,
  mimeType: string
): Promise<string> {
  await minioClient.putObject(env.STORAGE_BUCKET, storageKey, buffer, buffer.length, {
    'Content-Type': mimeType,
  });
  return getPublicUrl(storageKey);
}

export async function deleteFile(storageKey: string): Promise<void> {
  await minioClient.removeObject(env.STORAGE_BUCKET, storageKey);
}

export async function getPresignedUrl(storageKey: string, expirySeconds = 3600): Promise<string> {
  return minioClient.presignedGetObject(env.STORAGE_BUCKET, storageKey, expirySeconds);
}

export function getPublicUrl(storageKey: string): string {
  return `${env.STORAGE_ENDPOINT}/${env.STORAGE_BUCKET}/${storageKey}`;
}
