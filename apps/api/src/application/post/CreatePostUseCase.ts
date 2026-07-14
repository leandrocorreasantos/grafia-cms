import { Post } from '../../domain/post/Post';
import { PostStatus } from '../../domain/post/PostStatus';
import { IPostRepository } from '../../domain/post/IPostRepository';
import { v4 as uuidv4 } from 'uuid';
import { ConflictError } from '../../domain/errors/DomainError';
import { PostContentService } from './PostContentService';

export interface CreatePostInput {
    title: string;
    cover?: string;
    content: string;
    authorId: string;
    excerpt?: string;
    slug?: string;
    status?: PostStatus;
    type?: string;
    categoryIds?: string[];
    tagIds?: string[];
    scheduledAt?: Date;
}

export class CreatePostUseCase {
    constructor(
      private readonly postRepository: IPostRepository,
      private readonly contentService: PostContentService,
    ) { }

    async execute(input: CreatePostInput): Promise<Post> {
        const sanitizedContent = this.contentService.sanitize(input.content);
        const mediaIds = this.contentService.extractMediaIds(sanitizedContent);
        const slug = input.slug || this.contentService.generateSlug(input.title);
        const excerpt = input.excerpt || this.contentService.generateExcerpt(sanitizedContent);

        if (await this.postRepository.slugExists(slug)) {
            throw new ConflictError('Slug ja existe para outro post');
        }

        const status = input.status ?? PostStatus.DRAFT;
        const isPublished = status === PostStatus.PUBLISHED;

        const post = new Post({
            id: uuidv4(),
            title: input.title,
            cover: input.cover,
            type: input.type || 'post',
            content: sanitizedContent,
            excerpt,
            slug,
            status,
            authorId: input.authorId,
            mediaIds,
            categoryIds: input.categoryIds || [],
            tagIds: input.tagIds || [],
            wordCount: 0,
            imageCount: 0,
            linkCount: 0,
            createdAt: new Date(),
            publishedAt: isPublished ? new Date() : undefined,
            scheduledAt: input.scheduledAt,
        });

        await this.postRepository.save(post);
        await this.postRepository.replacePostMediaRelations(post.id, mediaIds);
        await this.postRepository.saveRevision(post, input.authorId);
        return post;
    }
}