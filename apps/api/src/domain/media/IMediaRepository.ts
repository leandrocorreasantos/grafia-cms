import { Media, MediaKind, MediaStatus } from './Media';

export interface MediaListFilters {
  search?: string;
  kind?: MediaKind | 'all';
  status?: MediaStatus | 'all';
  folder?: string;
  sortBy?: 'name' | 'createdAt' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

export interface MediaListResult {
  items: Media[];
  total: number;
  page: number;
  perPage: number;
}

export interface IMediaRepository {
  save(media: Media): Promise<void>;
  findById(id: string): Promise<Media | null>;
  list(filters: MediaListFilters): Promise<MediaListResult>;
  update(media: Media): Promise<void>;
  delete(id: string): Promise<void>;
}