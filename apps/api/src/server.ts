import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';

// Middlewares
import { errorHandler } from './interfaces/middlewares/errorHandler';

// Rotas
import { createAuthRoutes } from './interfaces/routes/authRoutes';
import { createMediaRoutes } from './interfaces/routes/mediaRoutes';
import { createPostRoutes } from './interfaces/routes/postRoutes';
import { createUserRoutes } from './interfaces/routes/userRoutes';
import { createCategoryRoutes } from './interfaces/routes/categoryRoutes';

config();

const app = express();
const prisma = new PrismaClient();
const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_PATH || '../../public/uploads');

// JWT Secret - usa variável de ambiente ou fallback para desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-nao-use-em-producao';

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadRoot));

// ============================================
// ROTAS
// ============================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'Grafia CMS API',
    version: process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Autenticação
app.use('/api/auth', createAuthRoutes(prisma, JWT_SECRET));

// Posts
app.use('/api/posts', createPostRoutes(prisma, JWT_SECRET));

// Media library
app.use('/api/media', createMediaRoutes(prisma, JWT_SECRET, uploadRoot));

// Usuários
app.use('/api/users', createUserRoutes(prisma, JWT_SECRET));

// Categorias e Tags (para o editor)
app.use('/api/categories', createCategoryRoutes(prisma, JWT_SECRET));

// ============================================
// TRATAMENTO DE ERROS
// ============================================

app.use(errorHandler);

// ============================================
// INICIALIZAÇÃO
// ============================================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Grafia API rodando em http://localhost:${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth:   http://localhost:${PORT}/api/auth/login`);
});