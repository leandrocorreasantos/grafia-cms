import { IPostRepository } from '../../domain/post/IPostRepository';
import { Post } from '../../domain/post/Post';
import { NotFoundError } from '../../domain/errors/DomainError';

export class GetPostByIdUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundError('Post', id);
    return post;
  }
}
