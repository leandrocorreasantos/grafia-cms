import { CreateUserUseCase, CreateUserInput } from '../../../src/application/user/CreateUserUseCase';
import { IUserRepository } from '../../../src/domain/user/IUserRepository';
import { User } from '../../../src/domain/user/User';
import { UserRole } from '../../../src/domain/user/UserRole';
import { ConflictError } from '../../../src/domain/errors/DomainError';

const mockUserRepository: jest.Mocked<IUserRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
  findByRole: jest.fn(),
};

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateUserUseCase(mockUserRepository);
  });

  const validInput: CreateUserInput = {
    email: 'novo@teste.com',
    name: 'Novo Usuario',
    password: 'senha123456',
    role: UserRole.AUTHOR,
  };

  it('deve criar usuario com dados validos', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const user = await useCase.execute(validInput);

    expect(user).toBeDefined();
    expect(user.getEmail()).toBe('novo@teste.com');
    expect(user.getName()).toBe('Novo Usuario');
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
  });

  it('deve normalizar email para lowercase', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const user = await useCase.execute({ ...validInput, email: 'NOVO@TESTE.COM' });

    expect(user.getEmail()).toBe('novo@teste.com');
  });

  it('deve lancar ConflictError para email duplicado', async () => {
    const existingUser = User.create({
      id: 'existing-id',
      email: 'novo@teste.com',
      name: 'Existente',
      passwordHash: 'hash',
      role: UserRole.AUTHOR,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockUserRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(useCase.execute(validInput)).rejects.toThrow(ConflictError);
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('deve lancar erro para senha curta (< 8 caracteres)', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ ...validInput, password: '123' })).rejects.toThrow('senha');
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('deve lancar erro para senha vazia', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ ...validInput, password: '' })).rejects.toThrow('senha');
  });

  it('deve usar AUTHOR como role padrao', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const user = await useCase.execute({ ...validInput, role: undefined });

    expect(user.getRole()).toBe(UserRole.AUTHOR);
  });

  it('deve usar role passada se especificada', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const user = await useCase.execute({ ...validInput, role: UserRole.EDITOR });

    expect(user.getRole()).toBe(UserRole.EDITOR);
  });
});
