export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  CONTRIBUTOR = 'contributor',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.EDITOR]: 80,
  [UserRole.AUTHOR]: 50,
  [UserRole.CONTRIBUTOR]: 20,
};

export const ALL_ROLES = Object.values(UserRole);

export function hasMinRole(role: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required];
}
