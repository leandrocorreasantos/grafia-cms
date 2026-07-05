import { Request, Response, NextFunction } from 'express';
import { PrismaUserRepository } from '../../infrastructure/repositories/UserRepository';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../domain/user/User';
import { UserRole } from '../../domain/user/UserRole';

export class UserController {
  constructor(private readonly userRepository: PrismaUserRepository) {}

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const users = await this.userRepository.findAll(limit, offset);

      const total = await this.userRepository.count();
      const list = users.map((u) => ({
        id: u.getId(),
        email: u.getEmail(),
        name: u.getName(),
        role: u.getRole(),
        createdAt: u.getCreatedAt(),
      }));

      res.json({ data: list, total, limit, offset });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userRepository.findById(req.params.id);
      if (!user) {
        res.status(404).json({ error: 'Usuario nao encontrado' });
        return;
      }

      res.json({
        id: user.getId(),
        email: user.getEmail(),
        name: user.getName(),
        role: user.getRole(),
        createdAt: user.getCreatedAt(),
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name, password, role } = req.body;
      if (!email || !name || !password) {
        res.status(400).json({ error: 'Email, nome e senha sao obrigatorios' });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' });
        return;
      }

      const existing = await this.userRepository.findByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'Email ja cadastrado' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = User.create({
        id: uuidv4(),
        email,
        name: name.trim(),
        passwordHash,
        role: (role as UserRole) || UserRole.AUTHOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.userRepository.save(user);

      res.status(201).json({
        id: user.getId(),
        email: user.getEmail(),
        name: user.getName(),
        role: user.getRole(),
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userRepository.findById(req.params.id);
      if (!user) {
        res.status(404).json({ error: 'Usuario nao encontrado' });
        return;
      }

      await this.userRepository.delete(req.params.id);
      res.json({ message: 'Usuario removido com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}
