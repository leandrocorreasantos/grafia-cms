import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../domain/user/IUserRepository';
import { User, WeakPasswordError } from '../../domain/user/User';
import { UserRole } from '../../domain/user/UserRole';
import { ConflictError } from '../../domain/errors/DomainError';

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();

    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new ConflictError('Email ja cadastrado');

    if (!input.password || input.password.length < 8) {
      throw new WeakPasswordError();
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = User.create({
      id: uuidv4(),
      email,
      name: input.name.trim(),
      passwordHash,
      role: input.role || UserRole.AUTHOR,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.userRepository.save(user);
    return user;
  }
}
