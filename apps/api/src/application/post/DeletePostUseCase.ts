import { IPostRepository } from '../../domain/post/IPostRepository';
import { NotFoundError } from '../../domain/errors/DomainError';

export class DeletePostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(id: string): Promise<void> {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundError('Post', id);
    await this.postRepository.delete(id);
  }
}
