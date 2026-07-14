export type MediaKind = 'image' | 'document' | 'video' | 'audio' | 'other';
export type MediaStatus = 'active' | 'trash' | 'unattached';
export type MediaViewMode = 'grid' | 'list';

export interface MediaItem {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  fileSizeHuman: string;
  mimeType: string;
  fileExtension: string;
  width?: number;
  height?: number;
  duration?: number;
  altText?: string;
  title?: string;
  caption?: string;
  description?: string;
  uploadedBy?: string;
  folder: string;
  status: MediaStatus;
  kind: MediaKind;
  thumbnails?: {
    thumbnail?: string;
    medium?: string;
    large?: string;
  };
  metadata?: Record<string, unknown>;
  shortcode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaListResponse {
  success: boolean;
  data: MediaItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface MediaSingleResponse {
  success: boolean;
  data: MediaItem;
}

export interface MediaUploadResponse {
  success: boolean;
  data: MediaItem[];
}

export interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl?: string;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
}

export interface MediaFiltersState {
  search: string;
  kind: MediaKind | 'all';
  status: MediaStatus | 'all';
  sortBy: 'name' | 'createdAt' | 'fileSize';
  sortOrder: 'asc' | 'desc';
  perPage: number;
  page: number;
}

export type PostStatus = 'draft' | 'pending' | 'published' | 'archived' | 'trash';

export interface PostItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover?: string;
  status: PostStatus;
  type: string;
  authorId: string;
  mediaIds: string[];
  categoryIds: string[];
  tagIds: string[];
  wordCount: number;
  imageCount: number;
  linkCount: number;
  autosaveAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledAt?: string;
}

export interface PostRevision {
  id: string;
  postId: string;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  createdBy?: string;
  createdAt: string;
}

export interface PostEditorPayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  cover?: string;
  status: PostStatus;
  type: string;
  scheduledAt?: string;
  categoryIds: string[];
  tagIds: string[];
}