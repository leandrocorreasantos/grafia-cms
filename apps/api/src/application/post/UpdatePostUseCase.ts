import { IPostRepository } from '../../domain/post/IPostRepository';
import { Post } from '../../domain/post/Post';
import { ConflictError, NotFoundError } from '../../domain/errors/DomainError';
import { PostStatus } from '../../domain/post/PostStatus';
import { PostContentService } from './PostContentService';

export interface UpdatePostInput {
  title?: string;
  cover?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  status?: PostStatus;
  type?: string;
  autosave?: boolean;
  scheduledAt?: Date;
  categoryIds?: string[];
  tagIds?: string[];
}

export class UpdatePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly contentService: PostContentService,
  ) {}

  async execute(id: string, input: UpdatePostInput): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundError('Post', id);

    const nextTitle = input.title ?? post.title;
    const nextContent = input.content !== undefined
      ? this.contentService.sanitize(input.content)
      : post.content;
    const nextSlug = input.slug || this.contentService.generateSlug(nextTitle);

    if (await this.postRepository.slugExists(nextSlug, id)) {
      throw new ConflictError('Slug ja existe para outro post');
    }

    const nextMediaIds = this.contentService.extractMediaIds(nextContent);
    const nextExcerpt = input.excerpt || this.contentService.generateExcerpt(nextContent);
    const nextStatus = input.status ?? post.status;
    const isPublished = nextStatus === PostStatus.PUBLISHED;

    post.updateAdvanced({
      title: nextTitle,
      content: nextContent,
      cover: input.cover,
      excerpt: nextExcerpt,
      slug: nextSlug,
      status: nextStatus,
      type: input.type,
      mediaIds: nextMediaIds,
      scheduledAt: input.scheduledAt,
      categoryIds: input.categoryIds,
      tagIds: input.tagIds,
    });

    if (isPublished && !post.publishedAt) {
      post.publish();
    }

    if (input.autosave) {
      post.touchAutosave();
    }

    await this.postRepository.save(post);
    await this.postRepository.replacePostMediaRelations(id, nextMediaIds);
    await this.postRepository.saveRevision(post);
    return post;
  }
}
