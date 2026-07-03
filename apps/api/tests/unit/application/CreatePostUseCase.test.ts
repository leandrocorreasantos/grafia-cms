import { CreatePostUseCase, CreatePostInput } from '../../../src/application/post/CreatePostUseCase';
import { IPostRepository } from '../../../src/domain/post/IPostRepository';
import { Post } from '../../../src/domain/post/Post';
import { PostStatus } from '../../../src/domain/post/PostStatus';

const mockPostRepository: jest.Mocked<IPostRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findAll: jest.fn(),
  findByAuthorId: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
};

describe('CreatePostUseCase', () => {
  let useCase: CreatePostUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreatePostUseCase(mockPostRepository);
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
    expect(post.status).toBe(PostStatus.DRAFT);
    expect(mockPostRepository.save).toHaveBeenCalledTimes(1);
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
});
