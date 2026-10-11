import multer from 'multer';
import { AppError } from './errorHandler';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/dicom',
  'application/pdf',
  'application/dicom',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type '${file.mimetype}' is not allowed`, 400, 'INVALID_FILE_TYPE') as any);
    }
  },
});
