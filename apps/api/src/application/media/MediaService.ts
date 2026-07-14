import crypto from 'crypto';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { ConflictError, DomainError } from '../../domain/errors/DomainError';
import { Media, MediaKind, MediaMetadata, MediaProps, MediaThumbnailSet } from '../../domain/media/Media';
import { StorageAdapter } from '../../infrastructure/storage/StorageAdapter';
import { MediaUploadPayload, ProcessedMediaFileInfo } from './MediaTypes';

interface MediaServiceConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
}

const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  medium: { width: 300, height: 300 },
  large: { width: 1024, height: 1024 },
} as const;

const MIME_KIND_MAP: Array<{ pattern: RegExp; kind: MediaKind; folder: string }> = [
  { pattern: /^image\//, kind: 'image', folder: 'images' },
  { pattern: /^(application\/pdf|application\/msword|application\/vnd\.|text\/plain)/, kind: 'document', folder: 'documents' },
  { pattern: /^video\//, kind: 'video', folder: 'videos' },
  { pattern: /^audio\//, kind: 'audio', folder: 'audio' },
];

export class MediaService {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly config: MediaServiceConfig,
  ) {}

  async processUpload(file: MediaUploadPayload, uploadedBy?: string, requestedFolder = '/'): Promise<ProcessedMediaFileInfo> {
    this.validateFile(file);

    const sanitizedBaseName = this.sanitizeFileName(path.parse(file.originalName).name);
    const extension = this.getExtension(file.originalName, file.mimeType);
    const kindInfo = this.getKindInfo(file.mimeType);
    const uniqueHash = crypto.createHash('sha1').update(`${Date.now()}-${file.originalName}-${file.size}`).digest('hex').slice(0, 12);
    const fileName = `${Date.now()}-${uniqueHash}-${sanitizedBaseName}.${extension}`;
    const folder = requestedFolder === '/' ? kindInfo.folder : requestedFolder.replace(/^\/+|\/+$/g, '');
    const relativePath = path.posix.join(folder, fileName);

    const storedFile = await this.storage.upload({
      buffer: file.buffer,
      relativePath,
      mimeType: file.mimeType,
    });

    const fileUrl = await this.storage.getUrl(relativePath);
    const info = await this.getFileInfo(file.buffer, file.mimeType, fileName);
    const thumbnails = kindInfo.kind === 'image'
      ? await this.generateThumbnails(file.buffer, folder, fileName)
      : undefined;

    const mediaProps: MediaProps = {
      id: uuidv4(),
      fileName,
      originalName: file.originalName,
      filePath: relativePath,
      fileUrl,
      fileSize: BigInt(file.size),
      mimeType: file.mimeType,
      fileExtension: extension,
      width: info.width,
      height: info.height,
      duration: info.duration,
      altText: sanitizedBaseName,
      title: sanitizedBaseName,
      description: '',
      caption: '',
      uploadedBy,
      folder: `/${folder}`,
      status: 'active',
      kind: kindInfo.kind,
      thumbnails,
      metadata: info.metadata,
      shortcode: `[media id="${fileName}"]`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      media: new Media(mediaProps),
      thumbnails,
      absolutePath: storedFile.absolutePath,
    };
  }

  async generateThumbnails(buffer: Buffer, folder: string, fileName: string): Promise<MediaThumbnailSet> {
    const thumbnailsDirectory = path.posix.join(folder, 'thumbnails');
    await this.storage.ensureDirectory(thumbnailsDirectory);
    const baseName = path.parse(fileName).name;

    const entries = await Promise.all(
      Object.entries(IMAGE_SIZES).map(async ([sizeName, size]) => {
        const thumbnailFileName = `${baseName}-${size.width}x${size.height}.webp`;
        const relativePath = path.posix.join(thumbnailsDirectory, thumbnailFileName);
        const resized = await sharp(buffer)
          .rotate()
          .resize(size.width, size.height, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();

        await this.storage.upload({
          buffer: resized,
          relativePath,
          mimeType: 'image/webp',
        });

        return [sizeName, await this.storage.getUrl(relativePath)] as const;
      }),
    );

    return Object.fromEntries(entries);
  }

  async getFileInfo(buffer: Buffer, mimeType: string, fileName: string): Promise<{
    width?: number;
    height?: number;
    duration?: number;
    metadata?: MediaMetadata;
  }> {
    if (mimeType.startsWith('image/')) {
      const image = sharp(buffer, { failOnError: false });
      const metadata = await image.metadata();

      return {
        width: metadata.width,
        height: metadata.height,
        metadata: {
          exif: metadata.exif ? { raw: metadata.exif.toString('base64') } : undefined,
        },
      };
    }

    if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
      try {
        const { parseBuffer } = await import('music-metadata');
        const metadata = await parseBuffer(buffer, mimeType, { duration: true, skipPostHeaders: true });
        return {
          duration: metadata.format.duration ? Math.round(metadata.format.duration) : undefined,
          metadata: {
            container: metadata.format.container,
            codec: metadata.format.codec,
            fileName,
          },
        };
      } catch {
        return { metadata: { fileName } };
      }
    }

    return { metadata: { fileName } };
  }

  sanitizeFileName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'arquivo';
  }

  formatFileSize(size: bigint): string {
    const numericSize = Number(size);
    if (numericSize < 1024) return `${numericSize} B`;
    if (numericSize < 1024 ** 2) return `${(numericSize / 1024).toFixed(1)} KB`;
    if (numericSize < 1024 ** 3) return `${(numericSize / 1024 ** 2).toFixed(1)} MB`;
    return `${(numericSize / 1024 ** 3).toFixed(1)} GB`;
  }

  async buildFileUrl(relativePath: string): Promise<string> {
    return this.storage.getUrl(relativePath);
  }

  private validateFile(file: MediaUploadPayload): void {
    if (!this.config.allowedMimeTypes.includes(file.mimeType)) {
      throw new DomainError(`Tipo de arquivo nao permitido: ${file.mimeType}`);
    }

    if (file.size > this.config.maxFileSize) {
      throw new ConflictError(`Arquivo excede o limite de ${(this.config.maxFileSize / 1024 / 1024).toFixed(0)}MB`);
    }
  }

  private getKindInfo(mimeType: string): { kind: MediaKind; folder: string } {
    const found = MIME_KIND_MAP.find((entry) => entry.pattern.test(mimeType));
    return found ?? { kind: 'other', folder: 'others' };
  }

  private getExtension(originalName: string, mimeType: string): string {
    const ext = path.extname(originalName).replace('.', '').toLowerCase();
    if (ext) return ext;

    const fallback = mimeType.split('/')[1]?.toLowerCase();
    return fallback || 'bin';
  }
}