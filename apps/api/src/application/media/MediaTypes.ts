import { Media, MediaKind, MediaThumbnailSet } from '../../domain/media/Media';

export interface MediaUploadPayload {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface MediaUploadInput {
  files: MediaUploadPayload[];
  uploadedBy?: string;
  folder?: string;
}

export interface MediaListInput {
  search?: string;
  kind?: MediaKind | 'all';
  status?: 'active' | 'trash' | 'unattached' | 'all';
  folder?: string;
  sortBy?: 'name' | 'createdAt' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

export interface MediaMetadataInput {
  title?: string;
  altText?: string;
  caption?: string;
  description?: string;
}

export interface MediaBulkActionInput {
  ids: string[];
  action: 'trash' | 'delete';
}

export interface MediaBulkRestoreInput {
  ids: string[];
}

export interface MediaDownloadBundle {
  media: Media[];
  archiveName: string;
}

export interface ProcessedMediaFileInfo {
  media: Media;
  thumbnails?: MediaThumbnailSet;
  absolutePath: string;
}