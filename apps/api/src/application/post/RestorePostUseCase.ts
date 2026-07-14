import { IPostRepository } from '../../domain/post/IPostRepository';
import { NotFoundError } from '../../domain/errors/DomainError';
import { Post } from '../../domain/post/Post';

export class RestorePostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundError('Post', id);

    post.restoreFromTrash();
    await this.postRepository.save(post);
    return post;
  }
}
