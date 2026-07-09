import { PrismaClient } from '@prisma/client';
import { Post } from '../../domain/post/Post';
import { PostStatus } from '../../domain/post/PostStatus';
import { IPostRepository } from '../../domain/post/IPostRepository';

const postInclude = {
    postCategories: { select: { categoryId: true } },
    postTags: { select: { tagId: true } }
};

type PrismaPostRecord = {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    status: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    postCategories?: Array<{ categoryId: string }>;
    postTags?: Array<{ tagId: string }>;
    categoryIds?: string[];
    tagIds?: string[];
};

export class PrismaPostRepository implements IPostRepository {
    constructor(private readonly prisma: PrismaClient) { }

    private toDomain(prismaPost: PrismaPostRecord): Post {
        return Post.restore({
            id: prismaPost.id,
            title: prismaPost.title,
            content: prismaPost.content,
            excerpt: prismaPost.excerpt,
            slug: prismaPost.slug,
            status: prismaPost.status as PostStatus,
            authorId: prismaPost.authorId,
            categoryIds: prismaPost.postCategories
                ? prismaPost.postCategories.map((item) => item.categoryId)
                : (prismaPost.categoryIds ?? []),
            tagIds: prismaPost.postTags
                ? prismaPost.postTags.map((item) => item.tagId)
                : (prismaPost.tagIds ?? []),
            createdAt: prismaPost.createdAt,
            updatedAt: prismaPost.updatedAt,
            publishedAt: prismaPost.publishedAt || undefined
        });
    }

    private buildCategoryLinks(categoryIds: string[]) {
        return [...new Set(categoryIds)].map((categoryId) => ({ categoryId }));
    }

    private buildTagLinks(tagIds: string[]) {
        return [...new Set(tagIds)].map((tagId) => ({ tagId }));
    }

    async save(post: Post): Promise<void> {
        const data = post.toJSON();
        await (this.prisma.post as any).upsert({
            where: { id: post.id },
            update: {
                title: data.title,
                content: data.content,
                excerpt: data.excerpt,
                slug: data.slug,
                status: data.status,
                authorId: data.authorId,
                postCategories: {
                    deleteMany: {},
                    createMany: {
                        data: this.buildCategoryLinks(data.categoryIds)
                    }
                },
                postTags: {
                    deleteMany: {},
                    createMany: {
                        data: this.buildTagLinks(data.tagIds)
                    }
                },
                updatedAt: new Date(),
                publishedAt: data.publishedAt
            },
            create: {
                id: data.id,
                title: data.title,
                content: data.content,
                excerpt: data.excerpt,
                slug: data.slug,
                status: data.status,
                authorId: data.authorId,
                postCategories: {
                    createMany: {
                        data: this.buildCategoryLinks(data.categoryIds)
                    }
                },
                postTags: {
                    createMany: {
                        data: this.buildTagLinks(data.tagIds)
                    }
                },
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                publishedAt: data.publishedAt
            }
        });
    }

    async findById(id: string): Promise<Post | null> {
        const data = await (this.prisma.post as any).findUnique({
            where: { id },
            include: postInclude
        });
        return data ? this.toDomain(data as PrismaPostRecord) : null;
    }

    async findBySlug(slug: string): Promise<Post | null> {
        const data = await (this.prisma.post as any).findUnique({
            where: { slug },
            include: postInclude
        });
        return data ? this.toDomain(data as PrismaPostRecord) : null;
    }

    async findAll(limit: number = 50, offset: number = 0): Promise<Post[]> {
        const posts = await (this.prisma.post as any).findMany({
            skip: offset,
            take: limit,
            include: postInclude,
            orderBy: { createdAt: 'desc' }
        });
        return (posts as PrismaPostRecord[]).map((post) => this.toDomain(post));
    }

    async findPublished(limit: number = 50, offset: number = 0): Promise<Post[]> {
        const posts = await (this.prisma.post as any).findMany({
            where: { status: PostStatus.PUBLISHED },
            skip: offset,
            take: limit,
            include: postInclude,
            orderBy: { createdAt: 'desc' }
        });
        return (posts as PrismaPostRecord[]).map((post) => this.toDomain(post));
    }

    async findByAuthorId(authorId: string): Promise<Post[]> {
        const posts = await (this.prisma.post as any).findMany({
            where: { authorId },
            include: postInclude,
            orderBy: { createdAt: 'desc' }
        });
        return (posts as PrismaPostRecord[]).map((post) => this.toDomain(post));
    }

    async count(): Promise<number> {
        return this.prisma.post.count();
    }

    async delete(id: string): Promise<void> {
        await this.prisma.post.delete({ where: { id } });
    }
}