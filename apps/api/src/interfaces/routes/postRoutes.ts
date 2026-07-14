import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPostRepository } from '../../infrastructure/repositories/PostRepository';
import { CreatePostUseCase } from '../../application/post/CreatePostUseCase';
import { GetPostsUseCase } from '../../application/post/GetPostsUseCase';
import { GetPostByIdUseCase } from '../../application/post/GetPostByIdUseCase';
import { UpdatePostUseCase } from '../../application/post/UpdatePostUseCase';
import { DeletePostUseCase } from '../../application/post/DeletePostUseCase';
import { RestorePostUseCase } from '../../application/post/RestorePostUseCase';
import { GetPostRevisionsUseCase } from '../../application/post/GetPostRevisionsUseCase';
import { PostController } from '../http/PostController';
import { JwtService } from '../../infrastructure/auth/JwtService';
import { authenticate, authenticateOptional } from '../middlewares/authMiddleware';
import {
  publicPostRateLimit,
  privatePostRateLimit,
} from '../middlewares/rateLimitMiddleware';
import { PostContentService } from '../../application/post/PostContentService';

export function createPostRoutes(prisma: PrismaClient, jwtSecret: string): Router {
  const router = Router();
  const postRepository = new PrismaPostRepository(prisma);
  const postContentService = new PostContentService();
  const jwtService = new JwtService(jwtSecret);

  const createPostUseCase = new CreatePostUseCase(postRepository, postContentService);
  const getPostsUseCase = new GetPostsUseCase(postRepository);
  const getPostByIdUseCase = new GetPostByIdUseCase(postRepository);
  const updatePostUseCase = new UpdatePostUseCase(postRepository, postContentService);
  const deletePostUseCase = new DeletePostUseCase(postRepository);
  const restorePostUseCase = new RestorePostUseCase(postRepository);
  const getPostRevisionsUseCase = new GetPostRevisionsUseCase(postRepository);

  const postController = new PostController(
    createPostUseCase,
    getPostsUseCase,
    getPostByIdUseCase,
    updatePostUseCase,
    deletePostUseCase,
    restorePostUseCase,
    getPostRevisionsUseCase,
  );

  // GET /api/posts - publico
  router.get(
    '/',
    publicPostRateLimit,
    authenticateOptional(jwtService),
    (req, res, next) => postController.list(req, res, next),
  );

  // GET /api/posts/:id - publico
  router.get(
    '/:id',
    publicPostRateLimit,
    authenticateOptional(jwtService),
    (req, res, next) => postController.getById(req, res, next),
  );

  // POST /api/posts - autenticado (author+)
  router.post('/', privatePostRateLimit, authenticate(jwtService), (req, res, next) =>
    postController.create(req, res, next),
  );

  // PUT /api/posts/:id - autenticado (author+)
  router.put('/:id', privatePostRateLimit, authenticate(jwtService), (req, res, next) =>
    postController.update(req, res, next),
  );

  // PUT /api/posts/:id/autosave - autenticado (author+)
  router.put('/:id/autosave', privatePostRateLimit, authenticate(jwtService), (req, res, next) =>
    postController.autosave(req, res, next),
  );

  // GET /api/posts/:id/revisions - autenticado (author+)
  router.get('/:id/revisions', privatePostRateLimit, authenticate(jwtService), (req, res, next) =>
    postController.revisions(req, res, next),
  );

  // POST /api/posts/:id/restore - autenticado (editor+)
  router.post('/:id/restore', privatePostRateLimit, authenticate(jwtService), (req, res, next) =>
    postController.restore(req, res, next),
  );

  // DELETE /api/posts/:id/permanent - autenticado (editor+)
  router.delete('/:id/permanent', privatePostRateLimit, authenticate(jwtService), (req, res, next) =>
    postController.permanentDelete(req, res, next),
  );

  // DELETE /api/posts/:id - autenticado (editor+)
  router.delete('/:id', privatePostRateLimit, authenticate(jwtService), (req, res, next) =>
    postController.delete(req, res, next),
  );

  return router;
}
