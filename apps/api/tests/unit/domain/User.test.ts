import { describe, it } from 'node:test';
import {expect } from '@jest/globals'
import { User, InvalidEmailError, InvalidNameError, WeakPasswordError, InvalidRoleError } from '../../../src/domain/user/User';
import { UserRole } from '../../../src/domain/user/UserRole';
import { v4 as uuidv4 } from 'uuid';

describe('User - Entidade de Dominio', () => {
  const validData = {
    id: uuidv4(),
    email: 'user@teste.com',
    name: 'Usuário Teste',
    passwordHash: '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiO1u',
    role: UserRole.AUTHOR,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create()', () => {
    it('deve criar usuario com dados validos', () => {
      const user = User.create(validData);
      expect(user.getId()).toBe(validData.id);
      expect(user.getEmail()).toBe(validData.email);
      expect(user.getName()).toBe(validData.name);
      expect(user.getPasswordHash()).toBe(validData.passwordHash);
      expect(user.getRole()).toBe(UserRole.AUTHOR);
    });

    it('deve normalizar email para lowercase', () => {
      const user = User.create({ ...validData, email: 'USER@TESTE.COM' });
      expect(user.getEmail()).toBe('user@teste.com');
    });

    it('deve trim nome', () => {
      const user = User.create({ ...validData, name: '  Nome com Espacos  ' });
      expect(user.getName()).toBe('Nome com Espacos');
    });

    it('deve lancar InvalidEmailError para email sem @', () => {
      expect(() => User.create({ ...validData, email: 'emailinvalido' })).toThrow(InvalidEmailError);
    });

    it('deve lancar InvalidEmailError para email sem dominio', () => {
      expect(() => User.create({ ...validData, email: 'user@' })).toThrow(InvalidEmailError);
    });

    it('deve lancar InvalidNameError para nome muito curto', () => {
      expect(() => User.create({ ...validData, name: 'A' })).toThrow(InvalidNameError);
    });

    it('deve lancar InvalidRoleError para role invalida', () => {
      expect(() => User.create({ ...validData, role: 'invalid-role' as UserRole })).toThrow(InvalidRoleError);
    });

    it('deve usar AUTHOR como role padrao se nao especificado', () => {
      const user = User.create({ ...validData, role: undefined as any });
      expect(user.getRole()).toBe(UserRole.AUTHOR);
    });
  });

  describe('updateProfile()', () => {
    it('deve atualizar nome e email', () => {
      const user = User.create(validData);
      user.updateProfile('Novo Nome', 'novo@email.com');
      expect(user.getName()).toBe('Novo Nome');
      expect(user.getEmail()).toBe('novo@email.com');
    });

    it('deve lancar erro para email invalido no update', () => {
      const user = User.create(validData);
      expect(() => user.updateProfile('Nome', 'invalido')).toThrow(InvalidEmailError);
    });

    it('deve lancar erro para nome curto no update', () => {
      const user = User.create(validData);
      expect(() => user.updateProfile('X', 'email@valido.com')).toThrow(InvalidNameError);
    });
  });

  describe('changeRole()', () => {
    it('deve alterar role para ADMIN', () => {
      const user = User.create(validData);
      user.changeRole(UserRole.ADMIN);
      expect(user.getRole()).toBe(UserRole.ADMIN);
    });

    it('deve alterar role para EDITOR', () => {
      const user = User.create(validData);
      user.changeRole(UserRole.EDITOR);
      expect(user.getRole()).toBe(UserRole.EDITOR);
    });

    it('deve lancar erro para role invalida', () => {
      const user = User.create(validData);
      expect(() => user.changeRole('invalid' as UserRole)).toThrow(InvalidRoleError);
    });
  });

  describe('getters', () => {
    it('deve retornar createdAt', () => {
      const user = User.create(validData);
      expect(user.getCreatedAt()).toBe(validData.createdAt);
    });
  });
});

