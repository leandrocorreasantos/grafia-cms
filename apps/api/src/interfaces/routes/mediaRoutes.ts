import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { MediaController } from '../http/MediaController';
import { authenticate } from '../middlewares/authMiddleware';
import { createMediaUploadMiddleware } from '../middlewares/upload';
import { privateMediaRateLimit, uploadMediaRateLimit } from '../middlewares/rateLimitMiddleware';
import { JwtService } from '../../infrastructure/auth/JwtService';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';
import { PrismaMediaRepository } from '../../infrastructure/repositories/MediaRepository';
import { MediaService } from '../../application/media/MediaService';
import { UploadMediaUseCase } from '../../application/media/UploadMediaUseCase';
import { ListMediaUseCase } from '../../application/media/ListMediaUseCase';
import { GetMediaByIdUseCase } from '../../application/media/GetMediaByIdUseCase';
import { UpdateMediaUseCase } from '../../application/media/UpdateMediaUseCase';
import { TrashMediaUseCase } from '../../application/media/TrashMediaUseCase';
import { DeleteMediaUseCase } from '../../application/media/DeleteMediaUseCase';
import { RestoreMediaUseCase } from '../../application/media/RestoreMediaUseCase';
import { BulkMediaActionUseCase } from '../../application/media/BulkMediaActionUseCase';

export function createMediaRoutes(prisma: PrismaClient, jwtSecret: string, uploadRoot: string): Router {
  const router = Router();
  const jwtService = new JwtService(jwtSecret);
  const mediaRepository = new PrismaMediaRepository(prisma);
  const storage = new LocalStorageAdapter(
    uploadRoot,
    process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  );
  const mediaService = new MediaService(storage, {
    maxFileSize: Number(process.env.UPLOAD_MAX_SIZE || 104857600),
    allowedMimeTypes: (process.env.UPLOAD_ALLOWED_TYPES || [
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
    ].join(',')).split(',').map((type) => type.trim()),
  });

  const listMediaUseCase = new ListMediaUseCase(mediaRepository);
  const getMediaByIdUseCase = new GetMediaByIdUseCase(mediaRepository);
  const uploadMediaUseCase = new UploadMediaUseCase(mediaRepository, mediaService);
  const updateMediaUseCase = new UpdateMediaUseCase(mediaRepository);
  const trashMediaUseCase = new TrashMediaUseCase(mediaRepository);
  const deleteMediaUseCase = new DeleteMediaUseCase(mediaRepository, storage);
  const restoreMediaUseCase = new RestoreMediaUseCase(mediaRepository);
  const bulkMediaActionUseCase = new BulkMediaActionUseCase(
    mediaRepository,
    trashMediaUseCase,
    deleteMediaUseCase,
    restoreMediaUseCase,
  );

  const controller = new MediaController(
    listMediaUseCase,
    getMediaByIdUseCase,
    uploadMediaUseCase,
    updateMediaUseCase,
    trashMediaUseCase,
    deleteMediaUseCase,
    restoreMediaUseCase,
    bulkMediaActionUseCase,
    mediaService,
    uploadRoot,
  );

  const upload = createMediaUploadMiddleware();

  router.get('/', privateMediaRateLimit, authenticate(jwtService), (req, res, next) => controller.list(req, res, next));
  router.get('/search', privateMediaRateLimit, authenticate(jwtService), (req, res, next) => controller.search(req, res, next));
  router.get('/download/:id', privateMediaRateLimit, authenticate(jwtService), (req, res, next) => controller.download(req, res, next));
  router.get('/download', privateMediaRateLimit, authenticate(jwtService), (req, res, next) => controller.bulkDownload(req, res, next));
  router.get('/:id', privateMediaRateLimit, authenticate(jwtService), (req, res, next) => controller.getById(req, res, next));
  router.post('/upload', uploadMediaRateLimit, authenticate(jwtService), upload.array('files', 20), (req, res, next) => controller.upload(req, res, next));
  router.put('/:id', privateMediaRateLimit, authenticate(jwtService), (req, res, next) => controller.update(req, res, next));
  router.delete('/:id', privateMediaRateLimit, authenticate(jwtService), (req, res, next) => controller.trash(req, res, next));
  router.delete('/:id/permanent', privateMediaRateLimit, authenticate(jwtService), (req, res, next) => controller.permanentDelete(req, res, next));
  router.post('/:id/restore', privateMediaRateLimit, authenticate(jwtService), (req, res, next) => controller.restore(req, res, next));
  router.post('/bulk-delete', privateMediaRateLimit, authenticate(jwtService), (req, res, next) => controller.bulkDelete(req, res, next));
  router.post('/bulk-restore', privateMediaRateLimit, authenticate(jwtService), (req, res, next) => controller.bulkRestore(req, res, next));

  return router;
}