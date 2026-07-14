import { Request, Response, NextFunction } from 'express';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { AuthorizationError } from '../../domain/errors/DomainError';
import { UserRole, hasMinRole } from '../../domain/user/UserRole';
import { DeleteMediaUseCase } from '../../application/media/DeleteMediaUseCase';
import { GetMediaByIdUseCase } from '../../application/media/GetMediaByIdUseCase';
import { ListMediaUseCase } from '../../application/media/ListMediaUseCase';
import { MediaService } from '../../application/media/MediaService';
import { RestoreMediaUseCase } from '../../application/media/RestoreMediaUseCase';
import { TrashMediaUseCase } from '../../application/media/TrashMediaUseCase';
import { UpdateMediaUseCase } from '../../application/media/UpdateMediaUseCase';
import { UploadMediaUseCase } from '../../application/media/UploadMediaUseCase';
import { BulkMediaActionUseCase } from '../../application/media/BulkMediaActionUseCase';

export class MediaController {
  constructor(
    private readonly listMediaUseCase: ListMediaUseCase,
    private readonly getMediaByIdUseCase: GetMediaByIdUseCase,
    private readonly uploadMediaUseCase: UploadMediaUseCase,
    private readonly updateMediaUseCase: UpdateMediaUseCase,
    private readonly trashMediaUseCase: TrashMediaUseCase,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
    private readonly restoreMediaUseCase: RestoreMediaUseCase,
    private readonly bulkMediaActionUseCase: BulkMediaActionUseCase,
    private readonly mediaService: MediaService,
    private readonly uploadRoot: string,
  ) {}

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.listMediaUseCase.execute({
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        kind: typeof req.query.kind === 'string' ? (req.query.kind as any) : 'all',
        status: typeof req.query.status === 'string' ? (req.query.status as any) : 'active',
        folder: typeof req.query.folder === 'string' ? req.query.folder : undefined,
        sortBy: typeof req.query.sortBy === 'string' ? (req.query.sortBy as any) : 'createdAt',
        sortOrder: typeof req.query.sortOrder === 'string' ? (req.query.sortOrder as any) : 'desc',
        page: req.query.page ? Number(req.query.page) : 1,
        perPage: req.query.perPage ? Number(req.query.perPage) : 25,
      });

      res.json({
        success: true,
        data: result.items.map((item) => this.serializeMedia(item)),
        meta: {
          total: result.total,
          page: result.page,
          perPage: result.perPage,
          totalPages: Math.ceil(result.total / result.perPage),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const media = await this.getMediaByIdUseCase.execute(req.params.id);
      res.json({ success: true, data: this.serializeMedia(media) });
    } catch (error) {
      next(error);
    }
  }

  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertMinRole(req.user?.role, UserRole.AUTHOR, 'Apenas autores ou superiores podem enviar arquivos');
      const files = ((req.files as Express.Multer.File[]) ?? []).map((file) => ({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      }));

      const media = await this.uploadMediaUseCase.execute({
        files,
        uploadedBy: req.user?.sub,
        folder: typeof req.body.folder === 'string' ? req.body.folder : '/',
      });

      res.status(201).json({
        success: true,
        data: media.map((item) => this.serializeMedia(item)),
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertMinRole(req.user?.role, UserRole.AUTHOR, 'Apenas autores ou superiores podem editar metadados');
      const media = await this.updateMediaUseCase.execute(req.params.id, req.body);
      res.json({ success: true, data: this.serializeMedia(media) });
    } catch (error) {
      next(error);
    }
  }

  async trash(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertMinRole(req.user?.role, UserRole.EDITOR, 'Apenas editores ou superiores podem mover arquivos para a lixeira');
      const media = await this.trashMediaUseCase.execute(req.params.id);
      res.json({ success: true, data: this.serializeMedia(media) });
    } catch (error) {
      next(error);
    }
  }

  async permanentDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertMinRole(req.user?.role, UserRole.EDITOR, 'Apenas editores ou superiores podem excluir arquivos');
      await this.deleteMediaUseCase.execute(req.params.id);
      res.json({ success: true, message: 'Arquivo excluido permanentemente' });
    } catch (error) {
      next(error);
    }
  }

  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertMinRole(req.user?.role, UserRole.EDITOR, 'Apenas editores ou superiores podem restaurar arquivos');
      const media = await this.restoreMediaUseCase.execute(req.params.id);
      res.json({ success: true, data: this.serializeMedia(media) });
    } catch (error) {
      next(error);
    }
  }

  async bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertMinRole(req.user?.role, UserRole.EDITOR, 'Apenas editores ou superiores podem executar acoes em massa');
      const count = await this.bulkMediaActionUseCase.execute({
        ids: req.body.ids ?? [],
        action: req.body.action ?? 'trash',
      });

      res.json({ success: true, count });
    } catch (error) {
      next(error);
    }
  }

  async bulkRestore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertMinRole(req.user?.role, UserRole.EDITOR, 'Apenas editores ou superiores podem restaurar arquivos');
      const count = await this.bulkMediaActionUseCase.restore({ ids: req.body.ids ?? [] });
      res.json({ success: true, count });
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    req.query.kind = typeof req.query.kind === 'string' ? req.query.kind : 'all';
    await this.list(req, res, next);
  }

  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertMinRole(req.user?.role, UserRole.AUTHOR, 'Apenas autores ou superiores podem baixar arquivos');
      const media = await this.getMediaByIdUseCase.execute(req.params.id);
      const data = media.toJSON();

      res.download(path.join(this.uploadRoot, data.filePath), data.originalName);
    } catch (error) {
      next(error);
    }
  }

  async bulkDownload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertMinRole(req.user?.role, UserRole.AUTHOR, 'Apenas autores ou superiores podem baixar arquivos');
      const ids = (req.query.ids as string)?.split(',').filter(Boolean) ?? [];
      const items = await Promise.all(ids.map((id) => this.getMediaByIdUseCase.execute(id)));

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="media-library-export.zip"');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (error) => next(error));
      archive.pipe(res);

      items.forEach((item) => {
        const data = item.toJSON();
        archive.append(fs.createReadStream(path.join(this.uploadRoot, data.filePath)), {
          name: data.originalName,
        });
      });

      await archive.finalize();
    } catch (error) {
      next(error);
    }
  }

  private assertMinRole(role: string | undefined, required: UserRole, message: string): void {
    if (!role || !hasMinRole(role as UserRole, required)) {
      throw new AuthorizationError(message);
    }
  }

  private serializeMedia(media: ReturnType<GetMediaByIdUseCase['execute']> extends Promise<infer T> ? T : never) {
    const data = media.toJSON();
    return {
      ...data,
      fileSizeHuman: this.mediaService.formatFileSize(data.fileSize),
      fileSize: Number(data.fileSize),
    };
  }
}