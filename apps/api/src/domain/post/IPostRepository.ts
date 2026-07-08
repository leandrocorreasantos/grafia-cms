import { Post } from './Post';

export interface IPostRepository {
  save(post: Post): Promise<void>;
  findById(id: string): Promise<Post | null>;
  findBySlug(slug: string): Promise<Post | null>;
  findAll(limit?: number, offset?: number): Promise<Post[]>;
  findPublished(limit?: number, offset?: number): Promise<Post[]>;
  findByAuthorId(authorId: string): Promise<Post[]>;
  count(): Promise<number>;
  delete(id: string): Promise<void>;
}
