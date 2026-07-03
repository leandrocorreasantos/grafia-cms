import { LoginUseCase, LoginInput, LoginOutput } from '../../../src/application/auth/LoginUseCase';
import { IUserRepository } from '../../../src/domain/user/IUserRepository';
import { User, UserData } from '../../../src/domain/user/User';
import { UserRole } from '../../../src/domain/user/UserRole';
import { JwtService } from '../../../src/infrastructure/auth/JwtService';
import { AuthenticationError } from '../../../src/domain/errors/DomainError';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Mock do JwtService
const mockJwtService = {
  generateToken: jest.fn().mockReturnValue('jwt-token-mockado'),
  verifyToken: jest.fn(),
} as unknown as jest.Mocked<JwtService>;

// Mock do UserRepository
const mockUserRepository: jest.Mocked<IUserRepository> = {
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
    passwordHash: bcrypt.hashSync('senha123', 10),
    role: UserRole.AUTHOR,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

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

      const result = await useCase.execute({ email: 'user@teste.com', password: 'senha123' });

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

      await useCase.execute({ email: 'USER@TESTE.COM', password: 'senha123' });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user@teste.com');
    });

    it('deve lancar AuthenticationError para email inexistente', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute({ email: 'naoexiste@teste.com', password: 'senha123' }))
        .rejects.toThrow(AuthenticationError);
    });

    it('deve lancar AuthenticationError para senha incorreta', async () => {
      const user = createUser();
      mockUserRepository.findByEmail.mockResolvedValue(user);

      await expect(useCase.execute({ email: 'user@teste.com', password: 'senhaerrada' }))
        .rejects.toThrow(AuthenticationError);
    });

    it('deve autenticar com Application Password valida', async () => {
      const user = createUser();
      mockUserRepository.findByEmail.mockResolvedValue(user);
      (mockUserRepository as any).findApplicationPassword.mockResolvedValue({
        id: 'app-pwd-id',
        passwordHash: bcrypt.hashSync('app-pwd-123', 10),
      });

      const result = await useCase.execute({
        email: 'user@teste.com',
        password: 'app-pwd-123',
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
      (mockUserRepository as any).findApplicationPassword.mockResolvedValue(null);

      await expect(useCase.execute({
        email: 'user@teste.com',
        password: 'app-pwd-123',
        appName: 'AppInexistente',
      })).rejects.toThrow(AuthenticationError);
    });

    it('deve lancar erro para Application Password com senha incorreta', async () => {
      const user = createUser();
      mockUserRepository.findByEmail.mockResolvedValue(user);
      (mockUserRepository as any).findApplicationPassword.mockResolvedValue({
        id: 'app-pwd-id',
        passwordHash: bcrypt.hashSync('senha-correta', 10),
      });

      await expect(useCase.execute({
        email: 'user@teste.com',
        password: 'senha-errada',
        appName: 'MyApp',
      })).rejects.toThrow(AuthenticationError);
    });

    it('deve atualizar lastUsedAt da Application Password', async () => {
      const user = createUser();
      mockUserRepository.findByEmail.mockResolvedValue(user);
      (mockUserRepository as any).findApplicationPassword.mockResolvedValue({
        id: 'app-pwd-id',
        passwordHash: bcrypt.hashSync('app-pwd-123', 10),
      });

      await useCase.execute({
        email: 'user@teste.com',
        password: 'app-pwd-123',
        appName: 'MyApp',
      });

      expect((mockUserRepository as any).updateApplicationPasswordLastUsed)
        .toHaveBeenCalledWith('app-pwd-id');
    });
  });
});
