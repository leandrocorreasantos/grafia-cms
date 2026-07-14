import { NotFoundError } from '../../domain/errors/DomainError';
import { IPostRepository } from '../../domain/post/IPostRepository';

export class GetPostRevisionsUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(postId: string, limit = 20) {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError('Post', postId);
    }

    return this.postRepository.findRevisions(postId, limit);
  }
}
