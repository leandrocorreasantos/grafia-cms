import { Post } from '../../domain/post/Post';
import { PostStatus } from '../../domain/post/PostStatus';
import { IPostRepository } from '../../infrastructure/repositories/PostRepository';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePostInput {
    title: string;
    content: string;
    authorId: string;
    status?: PostStatus;
}

export class CreatePostUseCase {
    constructor(private readonly postRepository: IPostRepository) { }

    async execute(input: CreatePostInput): Promise<Post> {
        const post = new Post({
            id: uuidv4(),
            title: input.title,
            content: input.content,
            excerpt: '',
            slug: '',
            status: input.status ?? PostStatus.DRAFT,
            authorId: input.authorId,
            categoryIds: [],
            tagIds: [],
            createdAt: new Date()
        });

        await this.postRepository.save(post);
        return post;
    }
}