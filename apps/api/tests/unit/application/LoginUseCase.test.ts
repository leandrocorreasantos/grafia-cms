import { LoginUseCase, LoginInput, LoginOutput } from '../../../src/application/auth/LoginUseCase';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { IUserRepository } from '../../../src/domain/user/IUserRepository';
import { User, UserData } from '../../../src/domain/user/User';
import { UserRole } from '../../../src/domain/user/UserRole';
import { JwtService } from '../../../src/infrastructure/auth/JwtService';
import { AuthenticationError } from '../../../src/domain/errors/DomainError';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

type LoginUserRepositoryMock = IUserRepository & {
  findApplicationPassword: (
    userId: string,
    name: string,
  ) => Promise<{ id: string; passwordHash: string } | null>;
  saveApplicationPassword: (
    userId: string,
    name: string,
    passwordHash: string,
  ) => Promise<void>;
  deleteApplicationPassword: (id: string) => Promise<void>;
  listApplicationPasswords: (userId: string) => Promise<
    Array<{ id: string; name: string; lastUsedAt: Date | null; createdAt: Date }>
  >;
  updateApplicationPasswordLastUsed: (id: string) => Promise<void>;
};

let TEST_USER_PASSWORD: string;
let TEST_APPLICATION_PASSWORD: string;

// Mock do JwtService
const mockJwtService = {
  generateToken: jest.fn().mockReturnValue('jwt-token-mockado'),
  verifyToken: jest.fn(),
} as unknown as jest.Mocked<JwtService>;

// Mock do UserRepository
const mockUserRepository: jest.Mocked<LoginUserRepositoryMock> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
  findByRole: jest.fn(),
  findApplicationPassword: jest.fn(),
  saveApplicationPassword: jest.fn(),
  deleteApplicationPassword: jest.fn(),
  listApplicationPasswords: jest.fn(),
  updateApplicationPasswordLastUsed: jest.fn(),
};

function createUser(overrides: Partial<UserData> = {}): User {
  return User.create({
    id: uuidv4(),
    email: 'user@teste.com',
    name: 'Usuário Teste',
    passwordHash: bcrypt.hashSync(TEST_USER_PASSWORD, 10),
    role: UserRole.AUTHOR,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

beforeAll(() => {
  TEST_USER_PASSWORD = process.env.LOGIN_TEST_USER_PASSWORD || '';
  TEST_APPLICATION_PASSWORD = process.env.LOGIN_TEST_APPLICATION_PASSWORD || '';

  if (!TEST_USER_PASSWORD || !TEST_APPLICATION_PASSWORD) {
    throw new Error('Missing LOGIN_TEST_USER_PASSWORD and/or LOGIN_TEST_APPLICATION_PASSWORD in .env.test');
  }
});

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LoginUseCase(mockUserRepository, mockJwtService);
  });

  describe('execute()', () => {
    it('deve autenticar usuario com credenciais validas', async () => {
      const user = createUser();
      mockUserRepository.findByEmail.mockResolvedValue(user);

      const result = await useCase.execute({ email: 'user@teste.com', password: TEST_USER_PASSWORD });

      expect(result).toHaveProperty('token', 'jwt-token-mockado');
      expect(result).toHaveProperty('type', 'user');
      expect(result.user.email).toBe('user@teste.com');
      expect(mockJwtService.generateToken).toHaveBeenCalledWith(
        expect.objectContaining({ sub: user.getId(), type: 'user' }),
      );
    });

    it('deve normalizar email para lowercase', async () => {
      const user = createUser({ email: 'user@teste.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);

      await useCase.execute({ email: 'USER@TESTE.COM', password: TEST_USER_PASSWORD });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user@teste.com');
    });

    it('deve lancar AuthenticationError para email inexistente', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute({ email: 'naoexiste@teste.com', password: TEST_USER_PASSWORD }))
        .rejects.toThrow(AuthenticationError);
    });

    it('deve lancar AuthenticationError para senha incorreta', async () => {
      const user = createUser();
      mockUserRepository.findByEmail.mockResolvedValue(user);

      await expect(useCase.execute({ email: 'user@teste.com', password: `${TEST_USER_PASSWORD}-errada` }))
        .rejects.toThrow(AuthenticationError);
    });

    it('deve autenticar com Application Password valida', async () => {
      const user = createUser();
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRepository.findApplicationPassword.mockResolvedValue({
        id: 'app-pwd-id',
        passwordHash: bcrypt.hashSync(TEST_APPLICATION_PASSWORD, 10),
      });

      const result = await useCase.execute({
        email: 'user@teste.com',
        password: TEST_APPLICATION_PASSWORD,
        appName: 'MyApp',
      });

      expect(result).toHaveProperty('type', 'application');
      expect(mockJwtService.generateToken).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'application', appName: 'MyApp' }),
      );
    });

    it('deve lancar erro para Application Password com nome inexistente', async () => {
      const user = createUser();
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRepository.findApplicationPassword.mockResolvedValue(null);

      await expect(useCase.execute({
        email: 'user@teste.com',
        password: TEST_APPLICATION_PASSWORD,
        appName: 'AppInexistente',
      })).rejects.toThrow(AuthenticationError);
    });

    it('deve lancar erro para Application Password com senha incorreta', async () => {
      const user = createUser();
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRepository.findApplicationPassword.mockResolvedValue({
        id: 'app-pwd-id',
        passwordHash: bcrypt.hashSync(TEST_APPLICATION_PASSWORD, 10),
      });

      await expect(useCase.execute({
        email: 'user@teste.com',
        password: `${TEST_APPLICATION_PASSWORD}-errada`,
        appName: 'MyApp',
      })).rejects.toThrow(AuthenticationError);
    });

    it('deve atualizar lastUsedAt da Application Password', async () => {
      const user = createUser();
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRepository.findApplicationPassword.mockResolvedValue({
        id: 'app-pwd-id',
        passwordHash: bcrypt.hashSync(TEST_APPLICATION_PASSWORD, 10),
      });

      await useCase.execute({
        email: 'user@teste.com',
        password: TEST_APPLICATION_PASSWORD,
        appName: 'MyApp',
      });

      expect(mockUserRepository.updateApplicationPasswordLastUsed)
        .toHaveBeenCalledWith('app-pwd-id');
    });
  });
});
