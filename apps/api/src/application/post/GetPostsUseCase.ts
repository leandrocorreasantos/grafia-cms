import { Post } from '../../domain/post/Post';
import { IPostRepository } from '../../domain/post/IPostRepository';

export interface GetPostsInput {
    search?: string;
    status?: string;
    type?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'publishedAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    perPage?: number;
    onlyPublished?: boolean;
}

export class GetPostsUseCase {
    constructor(private readonly postRepository: IPostRepository) { }

    async execute(input?: GetPostsInput): Promise<Post[]> {
        const page = Math.max(1, input?.page ?? 1);
        const perPage = Math.min(100, Math.max(1, input?.perPage ?? 25));

        if (input?.onlyPublished) {
            return this.postRepository.findPublished(perPage, (page - 1) * perPage);
        }

        return this.postRepository.findAll({
            search: input?.search,
            status: input?.status,
            type: input?.type,
            sortBy: input?.sortBy,
            sortOrder: input?.sortOrder,
            limit: perPage,
            offset: (page - 1) * perPage,
        });
    }
}
