import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Middlewares
import { errorHandler } from './interfaces/middlewares/errorHandler';

// Rotas
import { createAuthRoutes } from './interfaces/routes/authRoutes';
import { createPostRoutes } from './interfaces/routes/postRoutes';
import { createUserRoutes } from './interfaces/routes/userRoutes';

config();

const app = express();
const prisma = new PrismaClient();

// JWT Secret - usa variável de ambiente ou fallback para desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-nao-use-em-producao';

// Middlewares globais
app.use(cors());
app.use(express.json());

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

// Usuários
app.use('/api/users', createUserRoutes(prisma, JWT_SECRET));

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