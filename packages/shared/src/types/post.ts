export type PostStatus = 'draft' | 'published' | 'archived';

export interface Post {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    status: PostStatus;
    authorId: string;
    categoryIds: string[];
    tagIds: string[];
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
}