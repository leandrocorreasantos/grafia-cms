import { Request, Response, NextFunction } from 'express';
import { CreatePostUseCase } from '../../application/post/CreatePostUseCase';
import { GetPostsUseCase } from '../../application/post/GetPostsUseCase';
import { GetPostByIdUseCase } from '../../application/post/GetPostByIdUseCase';
import { UpdatePostUseCase } from '../../application/post/UpdatePostUseCase';
import { DeletePostUseCase } from '../../application/post/DeletePostUseCase';
import { RestorePostUseCase } from '../../application/post/RestorePostUseCase';
import { GetPostRevisionsUseCase } from '../../application/post/GetPostRevisionsUseCase';
import { AuthorizationError } from '../../domain/errors/DomainError';
import { UserRole, hasMinRole } from '../../domain/user/UserRole';
import { PostStatus } from '../../domain/post/PostStatus';

export class PostController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly getPostsUseCase: GetPostsUseCase,
    private readonly getPostByIdUseCase: GetPostByIdUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
    private readonly restorePostUseCase: RestorePostUseCase,
    private readonly getPostRevisionsUseCase: GetPostRevisionsUseCase,
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
      const canViewDrafts = !!_req.user && hasMinRole(_req.user.role, UserRole.AUTHOR);
      const posts = await this.getPostsUseCase.execute({
        search: typeof _req.query.search === 'string' ? _req.query.search : undefined,
        status: typeof _req.query.status === 'string' ? _req.query.status : undefined,
        type: typeof _req.query.type === 'string' ? _req.query.type : undefined,
        sortBy: typeof _req.query.sortBy === 'string' ? _req.query.sortBy as any : undefined,
        sortOrder: typeof _req.query.sortOrder === 'string' ? _req.query.sortOrder as any : undefined,
        page: _req.query.page ? Number(_req.query.page) : undefined,
        perPage: _req.query.perPage ? Number(_req.query.perPage) : undefined,
        onlyPublished: !canViewDrafts,
      });
      res.json(posts.map((post) => post.toJSON()));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const post = await this.getPostByIdUseCase.execute(req.params.id);
      const canViewUnpublished = !!req.user && hasMinRole(req.user.role, UserRole.AUTHOR);

      if (post.status !== PostStatus.PUBLISHED && !canViewUnpublished) {
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

  async autosave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Autenticacao necessaria' });
        return;
      }
      if (!hasMinRole(req.user.role, UserRole.AUTHOR)) {
        throw new AuthorizationError(
          'Apenas autores ou superiores podem salvar rascunhos',
        );
      }

      const post = await this.updatePostUseCase.execute(req.params.id, {
        ...req.body,
        autosave: true,
      });
      res.json({
        message: 'Auto-save concluido',
        post: post.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  async revisions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Autenticacao necessaria' });
        return;
      }
      if (!hasMinRole(req.user.role, UserRole.AUTHOR)) {
        throw new AuthorizationError(
          'Apenas autores ou superiores podem visualizar revisoes',
        );
      }

      const revisions = await this.getPostRevisionsUseCase.execute(
        req.params.id,
        req.query.limit ? Number(req.query.limit) : undefined,
      );
      res.json(revisions);
    } catch (error) {
      next(error);
    }
  }

  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Autenticacao necessaria' });
        return;
      }
      if (!hasMinRole(req.user.role, UserRole.EDITOR)) {
        throw new AuthorizationError(
          'Apenas editores ou superiores podem restaurar posts',
        );
      }

      const post = await this.restorePostUseCase.execute(req.params.id);
      res.json(post.toJSON());
    } catch (error) {
      next(error);
    }
  }

  async permanentDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Autenticacao necessaria' });
        return;
      }
      if (!hasMinRole(req.user.role, UserRole.EDITOR)) {
        throw new AuthorizationError(
          'Apenas editores ou superiores podem remover posts definitivamente',
        );
      }

      await this.deletePostUseCase.execute(req.params.id, true);
      res.json({ message: 'Post removido permanentemente' });
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

      await this.deletePostUseCase.execute(req.params.id, false);
      res.json({ message: 'Post movido para a lixeira com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}
