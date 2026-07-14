import { Post } from './Post';

export interface PostListFilters {
  search?: string;
  status?: string;
  type?: string;
  authorId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PostRevisionSnapshot {
  id: string;
  postId: string;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  createdBy?: string;
  createdAt: Date;
}

export interface IPostRepository {
  save(post: Post): Promise<void>;
  findById(id: string): Promise<Post | null>;
  findBySlug(slug: string): Promise<Post | null>;
  findAll(filters?: PostListFilters): Promise<Post[]>;
  findPublished(limit?: number, offset?: number): Promise<Post[]>;
  findByAuthorId(authorId: string): Promise<Post[]>;
  saveRevision(post: Post, createdBy?: string): Promise<void>;
  findRevisions(postId: string, limit?: number): Promise<PostRevisionSnapshot[]>;
  replacePostMediaRelations(postId: string, mediaIds: string[]): Promise<void>;
  slugExists(slug: string, excludePostId?: string): Promise<boolean>;
  count(): Promise<number>;
  hardDelete(id: string): Promise<void>;
}
