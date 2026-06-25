import { PrismaClient } from '@prisma/client';
import { Post } from '../../domain/post/Post';
import { PostStatus } from '../../domain/post/PostStatus';

// Tipo que representa o retorno do banco para o modelo Post
type PrismaPost = Awaited<ReturnType<PrismaClient['post']['findUnique']>>;

export interface IPostRepository {
    save(post: Post): Promise<void>;
    findById(id: string): Promise<Post | null>;
    findAll(limit?: number, offset?: number): Promise<Post[]>;
    delete(id: string): Promise<void>;
}

export class PrismaPostRepository implements IPostRepository {
    constructor(private readonly prisma: PrismaClient) { }

    private toDomain(prismaPost: NonNullable<PrismaPost>): Post {
        return Post.restore({
            id: prismaPost.id,
            title: prismaPost.title,
            content: prismaPost.content,
            excerpt: prismaPost.excerpt,
            slug: prismaPost.slug,
            status: prismaPost.status as PostStatus,
            authorId: prismaPost.authorId,
            categoryIds: prismaPost.categoryIds,
            tagIds: prismaPost.tagIds,
            createdAt: prismaPost.createdAt,
            updatedAt: prismaPost.updatedAt,
            publishedAt: prismaPost.publishedAt || undefined
        });
    }

    async save(post: Post): Promise<void> {
        const data = post.toJSON();
        await this.prisma.post.upsert({
            where: { id: post.id },
            update: {
                title: data.title,
                content: data.content,
                excerpt: data.excerpt,
                slug: data.slug,
                status: data.status,
                authorId: data.authorId,
                categoryIds: data.categoryIds,
                tagIds: data.tagIds,
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
                categoryIds: data.categoryIds,
                tagIds: data.tagIds,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                publishedAt: data.publishedAt
            }
        });
    }

    async findById(id: string): Promise<Post | null> {
        const data = await this.prisma.post.findUnique({ where: { id } });
        return data ? this.toDomain(data) : null;
    }

    async findAll(limit: number = 50, offset: number = 0): Promise<Post[]> {
        const posts = await this.prisma.post.findMany({
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
        return posts.map((post: NonNullable<PrismaPost>) => this.toDomain(post));
    }

    async delete(id: string): Promise<void> {
        await this.prisma.post.delete({ where: { id } });
    }
}