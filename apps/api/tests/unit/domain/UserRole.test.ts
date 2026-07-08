import { UserRole, hasMinRole, ROLE_HIERARCHY, ALL_ROLES } from '../../../src/domain/user/UserRole';

describe('UserRole - Value Object', () => {
  describe('hasMinRole()', () => {
    it('ADMIN deve ter acesso a qualquer cargo', () => {
      expect(hasMinRole(UserRole.ADMIN, UserRole.CONTRIBUTOR)).toBe(true);
      expect(hasMinRole(UserRole.ADMIN, UserRole.AUTHOR)).toBe(true);
      expect(hasMinRole(UserRole.ADMIN, UserRole.EDITOR)).toBe(true);
      expect(hasMinRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(true);
    });

    it('EDITOR deve ter acesso a AUTHOR e CONTRIBUTOR', () => {
      expect(hasMinRole(UserRole.EDITOR, UserRole.CONTRIBUTOR)).toBe(true);
      expect(hasMinRole(UserRole.EDITOR, UserRole.AUTHOR)).toBe(true);
      expect(hasMinRole(UserRole.EDITOR, UserRole.EDITOR)).toBe(true);
    });

    it('EDITOR nao deve ter acesso a ADMIN', () => {
      expect(hasMinRole(UserRole.EDITOR, UserRole.ADMIN)).toBe(false);
    });

    it('AUTHOR deve ter acesso a CONTRIBUTOR', () => {
      expect(hasMinRole(UserRole.AUTHOR, UserRole.CONTRIBUTOR)).toBe(true);
      expect(hasMinRole(UserRole.AUTHOR, UserRole.AUTHOR)).toBe(true);
    });

    it('AUTHOR nao deve ter acesso a EDITOR ou ADMIN', () => {
      expect(hasMinRole(UserRole.AUTHOR, UserRole.EDITOR)).toBe(false);
      expect(hasMinRole(UserRole.AUTHOR, UserRole.ADMIN)).toBe(false);
    });

    it('CONTRIBUTOR so deve ter acesso a ele mesmo', () => {
      expect(hasMinRole(UserRole.CONTRIBUTOR, UserRole.CONTRIBUTOR)).toBe(true);
      expect(hasMinRole(UserRole.CONTRIBUTOR, UserRole.AUTHOR)).toBe(false);
      expect(hasMinRole(UserRole.CONTRIBUTOR, UserRole.EDITOR)).toBe(false);
      expect(hasMinRole(UserRole.CONTRIBUTOR, UserRole.ADMIN)).toBe(false);
    });
  });

  describe('ROLE_HIERARCHY', () => {
    it('deve ter hierarquia decrescente', () => {
      expect(ROLE_HIERARCHY[UserRole.ADMIN]).toBeGreaterThan(ROLE_HIERARCHY[UserRole.EDITOR]);
      expect(ROLE_HIERARCHY[UserRole.EDITOR]).toBeGreaterThan(ROLE_HIERARCHY[UserRole.AUTHOR]);
      expect(ROLE_HIERARCHY[UserRole.AUTHOR]).toBeGreaterThan(ROLE_HIERARCHY[UserRole.CONTRIBUTOR]);
    });
  });

  describe('ALL_ROLES', () => {
    it('deve conter todos os cargos', () => {
      expect(ALL_ROLES).toContain(UserRole.ADMIN);
      expect(ALL_ROLES).toContain(UserRole.EDITOR);
      expect(ALL_ROLES).toContain(UserRole.AUTHOR);
      expect(ALL_ROLES).toContain(UserRole.CONTRIBUTOR);
    });
  });
});
