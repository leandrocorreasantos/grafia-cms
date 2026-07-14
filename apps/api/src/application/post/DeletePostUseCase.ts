import { IPostRepository } from '../../domain/post/IPostRepository';
import { NotFoundError } from '../../domain/errors/DomainError';

export class DeletePostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(id: string, permanent = false): Promise<void> {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundError('Post', id);

    if (permanent) {
      await this.postRepository.hardDelete(id);
      return;
    }

    post.markTrash();
    await this.postRepository.save(post);
  }
}
