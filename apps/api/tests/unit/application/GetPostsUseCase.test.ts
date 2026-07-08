import { GetPostsUseCase } from '../../../src/application/post/GetPostsUseCase';
import { IPostRepository } from '../../../src/domain/post/IPostRepository';
import { Post } from '../../../src/domain/post/Post';
import { PostStatus } from '../../../src/domain/post/PostStatus';
import { v4 as uuidv4 } from 'uuid';
import { jest } from '@jest/globals';
import { beforeEach, describe, expect, it } from '@jest/globals';

const mockPostRepository: jest.Mocked<IPostRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findAll: jest.fn(),
  findPublished: jest.fn(),
  findByAuthorId: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
};

function createMockPost(overrides: Partial<{ id: string; title: string; content: string }> = {}) {
  return Post.restore({
    id: overrides.id || uuidv4(),
    title: overrides.title || 'Post Teste',
    content: overrides.content || 'Conteudo do post com pelo menos 10 caracteres',
    excerpt: 'Resumo',
    slug: 'post-teste',
    status: PostStatus.DRAFT,
    authorId: uuidv4(),
    categoryIds: [],
    tagIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: undefined,
  });
}

describe('GetPostsUseCase', () => {
  let useCase: GetPostsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetPostsUseCase(mockPostRepository);
  });

  it('deve retornar lista de posts', async () => {
    const posts = [createMockPost({ title: 'Post 1' }), createMockPost({ title: 'Post 2' })];
    mockPostRepository.findAll.mockResolvedValue(posts);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Post 1');
    expect(mockPostRepository.findAll).toHaveBeenCalled();
  });

  it('deve retornar lista vazia quando nao ha posts', async () => {
    mockPostRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('deve retornar apenas publicados quando solicitado', async () => {
    const publishedPosts = [createMockPost({ title: 'Publicado 1' })];
    mockPostRepository.findPublished.mockResolvedValue(publishedPosts);

    const result = await useCase.execute({ onlyPublished: true });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Publicado 1');
    expect(mockPostRepository.findPublished).toHaveBeenCalled();
    expect(mockPostRepository.findAll).not.toHaveBeenCalled();
  });
});
