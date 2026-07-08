import { DomainError, NotFoundError, ConflictError, AuthenticationError, AuthorizationError } from '../../../src/domain/errors/DomainError';

describe('Domain Errors', () => {
  describe('DomainError', () => {
    it('deve criar erro com mensagem', () => {
      const err = new DomainError('Erro generico');
      expect(err.message).toBe('Erro generico');
      expect(err.name).toBe('DomainError');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('NotFoundError', () => {
    it('deve formatar mensagem com entidade e id', () => {
      const err = new NotFoundError('Usuario', 'abc-123');
      expect(err.message).toContain('Usuario');
      expect(err.message).toContain('abc-123');
      expect(err.name).toBe('NotFoundError');
    });
  });

  describe('ConflictError', () => {
    it('deve criar erro de conflito', () => {
      const err = new ConflictError('Email ja cadastrado');
      expect(err.message).toBe('Email ja cadastrado');
      expect(err.name).toBe('ConflictError');
    });
  });

  describe('AuthenticationError', () => {
    it('deve usar mensagem padrao', () => {
      const err = new AuthenticationError();
      expect(err.message).toBe('Credenciais invalidas');
      expect(err.name).toBe('AuthenticationError');
    });

    it('deve aceitar mensagem personalizada', () => {
      const err = new AuthenticationError('Token expirado');
      expect(err.message).toBe('Token expirado');
    });
  });

  describe('AuthorizationError', () => {
    it('deve usar mensagem padrao', () => {
      const err = new AuthorizationError();
      expect(err.message).toBe('Acesso nao autorizado');
      expect(err.name).toBe('AuthorizationError');
    });

    it('deve aceitar mensagem personalizada', () => {
      const err = new AuthorizationError('Cargo insuficiente');
      expect(err.message).toBe('Cargo insuficiente');
    });
  });
});
