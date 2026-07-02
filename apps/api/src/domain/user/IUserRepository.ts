import { User } from './User';
import { UserRole } from './UserRole';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(limit?: number, offset?: number): Promise<User[]>;
  count(): Promise<number>;
  delete(id: string): Promise<void>;
  findByRole(role: UserRole): Promise<User[]>;
}
