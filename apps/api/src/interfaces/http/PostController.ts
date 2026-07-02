import { Request, Response, NextFunction } from 'express';
import { CreatePostUseCase } from '../../application/post/CreatePostUseCase';
import { GetPostsUseCase } from '../../application/post/GetPostsUseCase';
import { GetPostByIdUseCase } from '../../application/post/GetPostByIdUseCase';
import { UpdatePostUseCase } from '../../application/post/UpdatePostUseCase';
import { DeletePostUseCase } from '../../application/post/DeletePostUseCase';
import { AuthorizationError } from '../../domain/errors/DomainError';
import { UserRole, hasMinRole } from '../../domain/user/UserRole';

export class PostController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly getPostsUseCase: GetPostsUseCase,
    private readonly getPostByIdUseCase: GetPostByIdUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Autenticacao necessaria' });
        return;
      }
      if (!hasMinRole(req.user.role, UserRole.AUTHOR)) {
        throw new AuthorizationError(
          'Apenas autores ou superiores podem criar posts',
        );
      }

      const post = await this.createPostUseCase.execute({
        ...req.body,
        authorId: req.user.sub,
      });

      res.status(201).json(post.toJSON());
    } catch (error) {
      next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const posts = await this.getPostsUseCase.execute();
      res.json(posts.map((post) => post.toJSON()));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const post = await this.getPostByIdUseCase.execute(req.params.id);
      if (!post) {
        res.status(404).json({ error: 'Post nao encontrado' });
        return;
      }
      res.json(post.toJSON());
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Autenticacao necessaria' });
        return;
      }
      if (!hasMinRole(req.user.role, UserRole.AUTHOR)) {
        throw new AuthorizationError(
          'Apenas autores ou superiores podem atualizar posts',
        );
      }

      const post = await this.updatePostUseCase.execute(req.params.id, req.body);
      res.json(post.toJSON());
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Autenticacao necessaria' });
        return;
      }
      if (!hasMinRole(req.user.role, UserRole.EDITOR)) {
        throw new AuthorizationError(
          'Apenas editores ou superiores podem remover posts',
        );
      }

      await this.deletePostUseCase.execute(req.params.id);
      res.json({ message: 'Post removido com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}
