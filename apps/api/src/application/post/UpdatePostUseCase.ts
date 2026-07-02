import { IPostRepository } from '../../domain/post/IPostRepository';
import { Post } from '../../domain/post/Post';
import { NotFoundError } from '../../domain/errors/DomainError';

export interface UpdatePostInput {
  title?: string;
  content?: string;
  status?: string;
}

export class UpdatePostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(id: string, input: UpdatePostInput): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundError('Post', id);

    if (input.title || input.content) {
      post.update(input.title || post.title, input.content || post.content);
    }

    if (input.status) {
      if (input.status === 'published') post.publish();
    }

    await this.postRepository.save(post);
    return post;
  }
}
