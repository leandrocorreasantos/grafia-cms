import { PrismaClient } from '@prisma/client';
import { User, UserData } from '../../domain/user/User';
import { UserRole } from '../../domain/user/UserRole';
import { IUserRepository } from '../../domain/user/IUserRepository';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(record: any): User {
    return User.create({
      id: record.id,
      email: record.email,
      name: record.name,
      passwordHash: record.passwordHash,
      role: record.role as UserRole,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.getId() },
      create: {
        id: user.getId(),
        email: user.getEmail(),
        name: user.getName(),
        passwordHash: user.getPasswordHash(),
        role: user.getRole(),
        createdAt: user.getCreatedAt(),
        updatedAt: new Date(),
      },
      update: {
        email: user.getEmail(),
        name: user.getName(),
        passwordHash: user.getPasswordHash(),
        role: user.getRole(),
        updatedAt: new Date(),
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  async findAll(limit = 50, offset = 0): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  // ---- Application Password methods ----
  async findApplicationPassword(
    userId: string,
    name: string,
  ): Promise<{ id: string; passwordHash: string } | null> {
    const record = await (this.prisma as any).applicationPassword.findUnique({
      where: { userId_name: { userId, name } },
    });
    return record ? { id: record.id, passwordHash: record.passwordHash } : null;
  }

  async saveApplicationPassword(
    userId: string,
    name: string,
    passwordHash: string,
  ): Promise<void> {
    await (this.prisma as any).applicationPassword.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name, passwordHash },
      update: { passwordHash },
    });
  }

  async deleteApplicationPassword(id: string): Promise<void> {
    await (this.prisma as any).applicationPassword.delete({ where: { id } });
  }

  async listApplicationPasswords(
    userId: string,
  ): Promise<
    Array<{ id: string; name: string; lastUsedAt: Date | null; createdAt: Date }>
  > {
    return (this.prisma as any).applicationPassword.findMany({
      where: { userId },
      select: { id: true, name: true, lastUsedAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateApplicationPasswordLastUsed(id: string): Promise<void> {
    await (this.prisma as any).applicationPassword.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}
