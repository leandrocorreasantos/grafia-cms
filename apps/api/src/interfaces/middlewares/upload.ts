import multer from 'multer';

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  'image/avif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'video/mp4',
  'video/webm',
  'video/x-msvideo',
  'audio/mpeg',
  'audio/wav',
];

export function createMediaUploadMiddleware() {
  const maxSize = Number(process.env.UPLOAD_MAX_SIZE || 104857600);
  const allowedTypes = process.env.UPLOAD_ALLOWED_TYPES
    ? process.env.UPLOAD_ALLOWED_TYPES.split(',').map((type) => type.trim())
    : DEFAULT_ALLOWED_TYPES;

  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSize,
      files: 20,
    },
    fileFilter: (_req, file, cb) => {
      if (!allowedTypes.includes(file.mimetype)) {
        cb(new Error(`Tipo de arquivo nao permitido: ${file.mimetype}`));
        return;
      }

      cb(null, true);
    },
  });
}