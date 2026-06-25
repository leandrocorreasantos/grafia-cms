import { Post } from '../../domain/post/Post';
import { IPostRepository } from '../../infrastructure/repositories/PostRepository';

export interface GetPostsInput {
    limit?: number;
    offset?: number;
}

export class GetPostsUseCase {
    constructor(private readonly postRepository: IPostRepository) { }

    async execute(input?: GetPostsInput): Promise<Post[]> {
        return this.postRepository.findAll(input?.limit, input?.offset);
    }
}
