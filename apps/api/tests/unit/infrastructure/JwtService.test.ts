import { JwtService } from '../../../src/infrastructure/auth/JwtService';
import { UserRole } from '../../../src/domain/user/UserRole';
import jwt from 'jsonwebtoken';

const SECRET = 'test-secret-key';

describe('JwtService', () => {
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService(SECRET, '1h');
  });

  describe('generateToken()', () => {
    it('deve gerar token JWT valido', () => {
      const token = jwtService.generateToken({
        sub: 'user-id',
        email: 'user@teste.com',
        role: UserRole.AUTHOR,
        type: 'user',
      });

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('deve gerar token com type=user como padrao', () => {
      const token = jwtService.generateToken({
        sub: 'user-id',
        email: 'user@teste.com',
        role: UserRole.EDITOR,
      });

      const decoded = jwt.verify(token, SECRET) as any;
      expect(decoded.type).toBe('user');
    });

    it('deve incluir appName no payload quando fornecido', () => {
      const token = jwtService.generateToken({
        sub: 'user-id',
        email: 'user@teste.com',
        role: UserRole.ADMIN,
        type: 'application',
        appName: 'Zapier',
      });

      const decoded = jwt.verify(token, SECRET) as any;
      expect(decoded.appName).toBe('Zapier');
      expect(decoded.type).toBe('application');
    });
  });

  describe('verifyToken()', () => {
    it('deve verificar token valido e retornar payload', () => {
      const token = jwtService.generateToken({
        sub: 'user-id',
        email: 'user@teste.com',
        role: UserRole.AUTHOR,
        type: 'user',
      });

      const payload = jwtService.verifyToken(token);

      expect(payload.sub).toBe('user-id');
      expect(payload.email).toBe('user@teste.com');
      expect(payload.role).toBe(UserRole.AUTHOR);
      expect(payload.type).toBe('user');
    });

    it('deve lancar erro para token invalido', () => {
      expect(() => jwtService.verifyToken('token-invalido')).toThrow();
    });

    it('deve lancar erro para token com segredo diferente', () => {
      const token = jwt.sign({ sub: 'user-id' }, 'outro-segredo');
      expect(() => jwtService.verifyToken(token)).toThrow();
    });
  });
});
