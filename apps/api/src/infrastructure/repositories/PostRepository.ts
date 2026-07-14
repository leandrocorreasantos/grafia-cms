import { PrismaClient } from '@prisma/client';
import { Post } from '../../domain/post/Post';
import { PostStatus } from '../../domain/post/PostStatus';
import { IPostRepository, PostListFilters, PostRevisionSnapshot } from '../../domain/post/IPostRepository';

const postInclude = {
    postMedia: { select: { mediaId: true } },
    postCategories: { select: { categoryId: true } },
    postTags: { select: { tagId: true } },
};

type PrismaPostRecord = {
    id: string;
    title: string;
    cover: string | null;
    type: string;
    content: string;
    excerpt: string;
    slug: string;
    status: string;
    authorId: string;
    autosaveAt: Date | null;
    deletedAt: Date | null;
    wordCount: number;
    imageCount: number;
    linkCount: number;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    scheduledAt: Date | null;
    postMedia?: Array<{ mediaId: string }>;
    postCategories?: Array<{ categoryId: string }>;
    postTags?: Array<{ tagId: string }>;
};

export class PrismaPostRepository implements IPostRepository {
    constructor(private readonly prisma: PrismaClient) {}

    private toDomain(prismaPost: PrismaPostRecord): Post {
        return Post.restore({
            id: prismaPost.id,
            title: prismaPost.title,
            cover: prismaPost.cover || undefined,
            type: prismaPost.type,
            content: prismaPost.content,
            excerpt: prismaPost.excerpt,
            slug: prismaPost.slug,
            status: prismaPost.status as PostStatus,
            authorId: prismaPost.authorId,
            mediaIds: prismaPost.postMedia ? prismaPost.postMedia.map((item) => item.mediaId) : [],
            categoryIds: prismaPost.postCategories
                ? prismaPost.postCategories.map((item) => item.categoryId)
                : [],
            tagIds: prismaPost.postTags
                ? prismaPost.postTags.map((item) => item.tagId)
                : [],
            wordCount: prismaPost.wordCount,
            imageCount: prismaPost.imageCount,
            linkCount: prismaPost.linkCount,
            autosaveAt: prismaPost.autosaveAt || undefined,
            deletedAt: prismaPost.deletedAt || undefined,
            createdAt: prismaPost.createdAt,
            updatedAt: prismaPost.updatedAt,
            publishedAt: prismaPost.publishedAt || undefined,
            scheduledAt: prismaPost.scheduledAt || undefined,
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
                cover: data.cover,
                type: data.type,
                content: data.content,
                excerpt: data.excerpt,
                slug: data.slug,
                status: data.status,
                authorId: data.authorId,
                wordCount: data.wordCount,
                imageCount: data.imageCount,
                linkCount: data.linkCount,
                autosaveAt: data.autosaveAt,
                deletedAt: data.deletedAt,
                postCategories: {
                    deleteMany: {},
                    createMany: {
                        data: this.buildCategoryLinks(data.categoryIds),
                    },
                },
                postTags: {
                    deleteMany: {},
                    createMany: {
                        data: this.buildTagLinks(data.tagIds),
                    },
                },
                updatedAt: new Date(),
                publishedAt: data.publishedAt,
                scheduledAt: data.scheduledAt,
            },
            create: {
                id: data.id,
                title: data.title,
                cover: data.cover,
                type: data.type,
                content: data.content,
                excerpt: data.excerpt,
                slug: data.slug,
                status: data.status,
                authorId: data.authorId,
                wordCount: data.wordCount,
                imageCount: data.imageCount,
                linkCount: data.linkCount,
                autosaveAt: data.autosaveAt,
                deletedAt: data.deletedAt,
                postCategories: {
                    createMany: {
                        data: this.buildCategoryLinks(data.categoryIds),
                    },
                },
                postTags: {
                    createMany: {
                        data: this.buildTagLinks(data.tagIds),
                    },
                },
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                publishedAt: data.publishedAt,
                scheduledAt: data.scheduledAt,
            },
        });
    }

    async findById(id: string): Promise<Post | null> {
        const data = await (this.prisma.post as any).findUnique({
            where: { id },
            include: postInclude,
        });
        return data ? this.toDomain(data as PrismaPostRecord) : null;
    }

    async findBySlug(slug: string): Promise<Post | null> {
        const data = await (this.prisma.post as any).findUnique({
            where: { slug },
            include: postInclude,
        });
        return data ? this.toDomain(data as PrismaPostRecord) : null;
    }

    async findAll(filters: PostListFilters = {}): Promise<Post[]> {
        const where: Record<string, unknown> = {
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.type ? { type: filters.type } : {}),
            ...(filters.authorId ? { authorId: filters.authorId } : {}),
            ...(filters.search
                ? {
                    OR: [
                        { title: { contains: filters.search, mode: 'insensitive' } },
                        { slug: { contains: filters.search, mode: 'insensitive' } },
                        { content: { contains: filters.search, mode: 'insensitive' } },
                        { excerpt: { contains: filters.search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };

        const sortBy = filters.sortBy || 'createdAt';
        const sortOrder = filters.sortOrder || 'desc';
        const posts = await (this.prisma.post as any).findMany({
            where,
            skip: filters.offset ?? 0,
            take: filters.limit ?? 50,
            include: postInclude,
            orderBy: { [sortBy]: sortOrder },
        });
        return (posts as PrismaPostRecord[]).map((post) => this.toDomain(post));
    }

    async findPublished(limit: number = 50, offset: number = 0): Promise<Post[]> {
        const posts = await (this.prisma.post as any).findMany({
            where: { status: PostStatus.PUBLISHED, deletedAt: null },
            skip: offset,
            take: limit,
            include: postInclude,
            orderBy: { createdAt: 'desc' },
        });
        return (posts as PrismaPostRecord[]).map((post) => this.toDomain(post));
    }

    async findByAuthorId(authorId: string): Promise<Post[]> {
        const posts = await (this.prisma.post as any).findMany({
            where: { authorId, deletedAt: null },
            include: postInclude,
            orderBy: { createdAt: 'desc' },
        });
        return (posts as PrismaPostRecord[]).map((post) => this.toDomain(post));
    }

    async saveRevision(post: Post, createdBy?: string): Promise<void> {
        const data = post.toJSON();

        await (this.prisma.postRevision as any).create({
            data: {
                postId: data.id,
                title: data.title,
                content: data.content,
                excerpt: data.excerpt,
                status: data.status,
                createdBy,
            },
        });
    }

    async findRevisions(postId: string, limit = 20): Promise<PostRevisionSnapshot[]> {
        const revisions = await (this.prisma.postRevision as any).findMany({
            where: { postId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return (revisions as PostRevisionSnapshot[]).map((revision) => ({
            ...revision,
            createdBy: revision.createdBy || undefined,
        }));
    }

    async replacePostMediaRelations(postId: string, mediaIds: string[]): Promise<void> {
        const uniqueIds = [...new Set(mediaIds)];
        await (this.prisma.postMedia as any).deleteMany({ where: { postId } });

        if (uniqueIds.length === 0) {
            return;
        }

        await (this.prisma.postMedia as any).createMany({
            data: uniqueIds.map((mediaId) => ({ postId, mediaId })),
            skipDuplicates: true,
        });
    }

    async slugExists(slug: string, excludePostId?: string): Promise<boolean> {
        const existing = await (this.prisma.post as any).findFirst({
            where: {
                slug,
                ...(excludePostId ? { id: { not: excludePostId } } : {}),
            },
            select: { id: true },
        });

        return !!existing;
    }

    async count(): Promise<number> {
        return this.prisma.post.count();
    }

    async hardDelete(id: string): Promise<void> {
        await this.prisma.post.delete({ where: { id } });
    }
}