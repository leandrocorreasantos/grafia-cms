import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { createAuthRoutes } from '../../src/interfaces/routes/authRoutes';
import { createPostRoutes } from '../../src/interfaces/routes/postRoutes';
import { createUserRoutes } from '../../src/interfaces/routes/userRoutes';
import { errorHandler } from '../../src/interfaces/middlewares/errorHandler';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

config();

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

/**
 * Cria uma instância do app Express para testes.
 * Usa um PrismaClient compartilhado.
 */
export function createTestApp(prisma: PrismaClient) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Rotas
  app.use('/api/auth', createAuthRoutes(prisma, JWT_SECRET));
  app.use('/api/posts', createPostRoutes(prisma, JWT_SECRET));
  app.use('/api/users', createUserRoutes(prisma, JWT_SECRET));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

export { JWT_SECRET };

/**
 * Cria um usuário admin no banco para testes.
 */
export async function seedAdmin(prisma: PrismaClient) {
  const email = 'admin@teste.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash('admin123', 10);
  return prisma.user.create({
    data: {
      id: uuidv4(),
      email,
      name: 'Admin Teste',
      passwordHash,
      role: 'admin',
    },
  });
}

/**
 * Cria um usuário author no banco para testes.
 */
export async function seedAuthor(prisma: PrismaClient) {
  const email = 'author@teste.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash('author123', 10);
  return prisma.user.create({
    data: {
      id: uuidv4(),
      email,
      name: 'Author Teste',
      passwordHash,
      role: 'author',
    },
  });
}

/**
 * Cria um usuário editor no banco para testes.
 */
export async function seedEditor(prisma: PrismaClient) {
  const email = 'editor@teste.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash('editor123', 10);
  return prisma.user.create({
    data: {
      id: uuidv4(),
      email,
      name: 'Editor Teste',
      passwordHash,
      role: 'editor',
    },
  });
}
