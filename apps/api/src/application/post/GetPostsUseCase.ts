import { Post } from '../../domain/post/Post';
import { IPostRepository } from '../../domain/post/IPostRepository';

export interface GetPostsInput {
    limit?: number;
    offset?: number;
    onlyPublished?: boolean;
}

export class GetPostsUseCase {
    constructor(private readonly postRepository: IPostRepository) { }

    async execute(input?: GetPostsInput): Promise<Post[]> {
        if (input?.onlyPublished) {
            return this.postRepository.findPublished(input.limit, input.offset);
        }

        return this.postRepository.findAll(input?.limit, input?.offset);
    }
}
