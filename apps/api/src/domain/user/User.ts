import { UserRole } from './UserRole';

export interface UserData {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class InvalidEmailError extends Error {
  constructor(email: string) {
    super(`Email invalido: ${email}`);
    this.name = 'InvalidEmailError';
  }
}

export class InvalidNameError extends Error {
  constructor(name: string) {
    super(`Nome invalido: "${name}" deve ter pelo menos 2 caracteres`);
    this.name = 'InvalidNameError';
  }
}

export class WeakPasswordError extends Error {
  constructor() {
    super('A senha deve ter pelo menos 8 caracteres');
    this.name = 'WeakPasswordError';
  }
}

export class InvalidRoleError extends Error {
  constructor(role: string) {
    super(`Cargo invalido: "${role}"`);
    this.name = 'InvalidRoleError';
  }
}

export class User {
  private constructor(
    private readonly id: string,
    private email: string,
    private name: string,
    private readonly passwordHash: string,
    private role: UserRole,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(data: UserData): User {
    User.validate(data);
    return new User(
      data.id,
      data.email.trim().toLowerCase(),
      data.name.trim(),
      data.passwordHash,
      data.role || UserRole.AUTHOR,
      data.createdAt,
      data.updatedAt,
    );
  }

  private static validate(data: Partial<UserData>): void {
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new InvalidEmailError(data.email);
    }
    if (data.name && data.name.trim().length < 2) {
      throw new InvalidNameError(data.name);
    }
    if (data.role && !Object.values(UserRole).includes(data.role)) {
      throw new InvalidRoleError(data.role);
    }
  }

  updateProfile(name: string, email: string): void {
    User.validate({ name, email });
    this.name = name.trim();
    this.email = email.trim().toLowerCase();
    this.updatedAt = new Date();
  }

  changeRole(newRole: UserRole): void {
    if (!Object.values(UserRole).includes(newRole)) {
      throw new InvalidRoleError(newRole);
    }
    this.role = newRole;
    this.updatedAt = new Date();
  }

  getId(): string { return this.id; }
  getEmail(): string { return this.email; }
  getName(): string { return this.name; }
  getPasswordHash(): string { return this.passwordHash; }
  getRole(): UserRole { return this.role; }
  getCreatedAt(): Date { return this.createdAt; }
}
