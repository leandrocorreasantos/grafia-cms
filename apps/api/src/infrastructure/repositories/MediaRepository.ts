import { Prisma, PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../domain/errors/DomainError';
import { IMediaRepository, MediaListFilters, MediaListResult } from '../../domain/media/IMediaRepository';
import { Media, MediaKind, MediaProps, MediaStatus } from '../../domain/media/Media';

type PrismaMediaRecord = Prisma.MediaGetPayload<Record<string, never>>;

export class PrismaMediaRepository implements IMediaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(media: Media): Promise<void> {
    const data = media.toJSON();

    await this.prisma.media.create({
      data: this.toPersistence(data),
    });
  }

  async findById(id: string): Promise<Media | null> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    return media ? this.toDomain(media) : null;
  }

  async list(filters: MediaListFilters): Promise<MediaListResult> {
    const page = Math.max(1, filters.page ?? 1);
    const perPage = Math.min(100, Math.max(1, filters.perPage ?? 25));
    const where: Prisma.MediaWhereInput = {
      ...(filters.kind && filters.kind !== 'all' ? { kind: filters.kind } : {}),
      ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
      ...(filters.folder ? { folder: filters.folder } : {}),
      ...(filters.search
        ? {
            OR: [
              { fileName: { contains: filters.search, mode: 'insensitive' } },
              { originalName: { contains: filters.search, mode: 'insensitive' } },
              { title: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy = this.buildOrderBy(filters.sortBy, filters.sortOrder);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.media.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toDomain(item)),
      total,
      page,
      perPage,
    };
  }

  async update(media: Media): Promise<void> {
    const data = media.toJSON();

    await this.prisma.media.update({
      where: { id: data.id },
      data: this.toPersistence(data),
    });
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.media.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError('Media', id);
      }

      throw error;
    }
  }

  private toDomain(record: PrismaMediaRecord): Media {
    return Media.restore({
      id: record.id,
      fileName: record.fileName,
      originalName: record.originalName,
      filePath: record.filePath,
      fileUrl: record.fileUrl,
      fileSize: record.fileSize,
      mimeType: record.mimeType,
      fileExtension: record.fileExtension,
      width: record.width ?? undefined,
      height: record.height ?? undefined,
      duration: record.duration ?? undefined,
      altText: record.altText ?? undefined,
      title: record.title ?? undefined,
      caption: record.caption ?? undefined,
      description: record.description ?? undefined,
      uploadedBy: record.uploadedBy ?? undefined,
      folder: record.folder,
      status: record.status as MediaStatus,
      kind: record.kind as MediaKind,
      thumbnails: (record.thumbnails as Record<string, string> | null) ?? undefined,
      metadata: (record.metadata as Record<string, unknown> | null) ?? undefined,
      shortcode: record.shortcode ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private toPersistence(data: MediaProps): Prisma.MediaUncheckedCreateInput {
    return {
      id: data.id,
      fileName: data.fileName,
      originalName: data.originalName,
      filePath: data.filePath,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      fileExtension: data.fileExtension,
      width: data.width,
      height: data.height,
      duration: data.duration,
      altText: data.altText,
      title: data.title,
      caption: data.caption,
      description: data.description,
      uploadedBy: data.uploadedBy,
      folder: data.folder,
      status: data.status,
      kind: data.kind,
      thumbnails: data.thumbnails ? (data.thumbnails as Prisma.InputJsonValue) : Prisma.JsonNull,
      metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      shortcode: data.shortcode,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private buildOrderBy(sortBy?: MediaListFilters['sortBy'], sortOrder?: MediaListFilters['sortOrder']): Prisma.MediaOrderByWithRelationInput {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    if (sortBy === 'name') {
      return { fileName: order };
    }

    if (sortBy === 'fileSize') {
      return { fileSize: order };
    }

    return { createdAt: order };
  }
}