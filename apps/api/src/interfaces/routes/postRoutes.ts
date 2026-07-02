import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPostRepository } from '../../infrastructure/repositories/PostRepository';
import { CreatePostUseCase } from '../../application/post/CreatePostUseCase';
import { GetPostsUseCase } from '../../application/post/GetPostsUseCase';
import { GetPostByIdUseCase } from '../../application/post/GetPostByIdUseCase';
import { UpdatePostUseCase } from '../../application/post/UpdatePostUseCase';
import { DeletePostUseCase } from '../../application/post/DeletePostUseCase';
import { PostController } from '../http/PostController';
import { JwtService } from '../../infrastructure/auth/JwtService';
import { authenticate } from '../middlewares/authMiddleware';

export function createPostRoutes(prisma: PrismaClient, jwtSecret: string): Router {
  const router = Router();
  const postRepository = new PrismaPostRepository(prisma);
  const jwtService = new JwtService(jwtSecret);

  const createPostUseCase = new CreatePostUseCase(postRepository);
  const getPostsUseCase = new GetPostsUseCase(postRepository);
  const getPostByIdUseCase = new GetPostByIdUseCase(postRepository);
  const updatePostUseCase = new UpdatePostUseCase(postRepository);
  const deletePostUseCase = new DeletePostUseCase(postRepository);

  const postController = new PostController(
    createPostUseCase,
    getPostsUseCase,
    getPostByIdUseCase,
    updatePostUseCase,
    deletePostUseCase,
  );

  // GET /api/posts - publico
  router.get('/', (req, res, next) => postController.list(req, res, next));

  // GET /api/posts/:id - publico
  router.get('/:id', (req, res, next) => postController.getById(req, res, next));

  // POST /api/posts - autenticado (author+)
  router.post('/', authenticate(jwtService), (req, res, next) =>
    postController.create(req, res, next),
  );

  // PUT /api/posts/:id - autenticado (author+)
  router.put('/:id', authenticate(jwtService), (req, res, next) =>
    postController.update(req, res, next),
  );

  // DELETE /api/posts/:id - autenticado (editor+)
  router.delete('/:id', authenticate(jwtService), (req, res, next) =>
    postController.delete(req, res, next),
  );

  return router;
}
