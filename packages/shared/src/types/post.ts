import type { CategorySummary } from './category';
import type { TagSummary } from './tag';

export type PostStatus = 'draft' | 'published' | 'archived';

export interface PostSummary {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    status: PostStatus;
    authorId: string;
    categoryIds: string[];
    tagIds: string[];
    categories?: CategorySummary[];
    tags?: TagSummary[];
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
}

export type Post = PostSummary;