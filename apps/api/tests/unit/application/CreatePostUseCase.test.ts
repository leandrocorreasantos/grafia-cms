import { CreatePostUseCase, CreatePostInput } from '../../../src/application/post/CreatePostUseCase';
import { IPostRepository } from '../../../src/domain/post/IPostRepository';
import { PostStatus } from '../../../src/domain/post/PostStatus';
import { PostContentService } from '../../../src/application/post/PostContentService';
import { ConflictError } from '../../../src/domain/errors/DomainError';
import { jest, beforeEach, describe, expect, it } from '@jest/globals';

const mockPostRepository: jest.Mocked<IPostRepository> = {
  save: jest.fn((post: any) => Promise.resolve()),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findAll: jest.fn(),
  findPublished: jest.fn(),
  findByAuthorId: jest.fn(),
  count: jest.fn(),
  hardDelete: jest.fn(),
  saveRevision: jest.fn(),
  findRevisions: jest.fn(),
  replacePostMediaRelations: jest.fn(),
  slugExists: jest.fn(async (slug: string, excludePostId?: string) => false),
};

describe('CreatePostUseCase', () => {
  let useCase: CreatePostUseCase;
  let contentService: PostContentService;

  beforeEach(() => {
    jest.clearAllMocks();
    contentService = new PostContentService();
    useCase = new CreatePostUseCase(mockPostRepository, contentService);
    // Restaurar slugExists para false por padrão (clearAllMocks não restaura implementações)
    mockPostRepository.slugExists.mockImplementation(async (slug: string, excludePostId?: string) => false);
  });

  const validInput: CreatePostInput = {
    title: 'Titulo do Post',
    content: 'Conteudo do post com pelo menos 10 caracteres para validacao',
    authorId: 'author-id-123',
  };

  it('deve criar post com dados validos', async () => {
    const post = await useCase.execute(validInput);

    expect(post).toBeDefined();
    expect(post.title).toBe(validInput.title);
    expect(post.content).toBe(validInput.content);
    expect(post.authorId).toBe(validInput.authorId);
    expect(post.cover).toBeUndefined();
    expect(post.status).toBe(PostStatus.DRAFT);
    expect(mockPostRepository.save).toHaveBeenCalledTimes(1);
  });

  it('deve aceitar cover opcional', async () => {
    const post = await useCase.execute({
      ...validInput,
      cover: 'https://cdn.exemplo.com/post-cover.jpg',
    });

    expect(post.cover).toBe('https://cdn.exemplo.com/post-cover.jpg');
  });

  it('deve usar DRAFT como status padrao', async () => {
    const post = await useCase.execute(validInput);

    expect(post.status).toBe(PostStatus.DRAFT);
  });

  it('deve aceitar status especifico', async () => {
    const post = await useCase.execute({ ...validInput, status: PostStatus.PUBLISHED });

    expect(post.status).toBe(PostStatus.PUBLISHED);
  });

  it('deve chamar repository.save com o post criado', async () => {
    const post = await useCase.execute(validInput);

    expect(mockPostRepository.save).toHaveBeenCalledWith(post);
    expect(mockPostRepository.save).toHaveBeenCalledTimes(1);
  });

  it('deve gerar um id unico (uuid)', async () => {
    const post1 = await useCase.execute(validInput);
    const post2 = await useCase.execute(validInput);

    expect(post1.id).not.toBe(post2.id);
  });

  it('deve lancar ConflictError quando slug ja existe', async () => {
    mockPostRepository.slugExists.mockResolvedValue(true);

    await expect(useCase.execute(validInput)).rejects.toThrow(ConflictError);
    expect(mockPostRepository.save).not.toHaveBeenCalled();
  });

  it('deve chamar contentService.sanitize com o conteudo', async () => {
    const sanitizeSpy = jest.spyOn(contentService, 'sanitize');

    await useCase.execute(validInput);

    expect(sanitizeSpy).toHaveBeenCalledWith(validInput.content);
  });

  it('deve chamar contentService.extractMediaIds com o conteudo sanitizado', async () => {
    const extractSpy = jest.spyOn(contentService, 'extractMediaIds');

    await useCase.execute(validInput);

    expect(extractSpy).toHaveBeenCalled();
  });

  it('deve chamar replacePostMediaRelations com os IDs extraidos', async () => {
    await useCase.execute(validInput);

    expect(mockPostRepository.replacePostMediaRelations).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
    );
    expect(mockPostRepository.replacePostMediaRelations).toHaveBeenCalledTimes(1);
  });

  it('deve chamar saveRevision com o post criado', async () => {
    await useCase.execute(validInput);

    expect(mockPostRepository.saveRevision).toHaveBeenCalledWith(
      expect.any(Object),
      validInput.authorId,
    );
    expect(mockPostRepository.saveRevision).toHaveBeenCalledTimes(1);
  });

  it('deve definir type padrao como "post"', async () => {
    const post = await useCase.execute(validInput);

    expect(post.type).toBe('post');
  });

  it('deve definir publishedAt quando status for PUBLISHED', async () => {
    const post = await useCase.execute({ ...validInput, status: PostStatus.PUBLISHED });

    expect(post.publishedAt).toBeInstanceOf(Date);
    expect(post.status).toBe(PostStatus.PUBLISHED);
  });

  it('nao deve definir publishedAt quando status for DRAFT', async () => {
    const post = await useCase.execute(validInput);

    expect(post.publishedAt).toBeUndefined();
  });
});
