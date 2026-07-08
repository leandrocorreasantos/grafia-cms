import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from '../http/AuthController';
import { AppPasswordController } from '../http/AppPasswordController';
import { JwtService } from '../../infrastructure/auth/JwtService';
import { PrismaUserRepository } from '../../infrastructure/repositories/UserRepository';
import { LoginUseCase } from '../../application/auth/LoginUseCase';
import { authenticate, requireUserToken } from '../middlewares/authMiddleware';
import {
  publicAuthRateLimit,
  privateAuthRateLimit,
} from '../middlewares/rateLimitMiddleware';

export function createAuthRoutes(prisma: PrismaClient, jwtSecret: string): Router {
  const router = Router();
  const jwtService = new JwtService(jwtSecret);
  const userRepository = new PrismaUserRepository(prisma);
  const loginUseCase = new LoginUseCase(userRepository, jwtService);
  const authController = new AuthController(loginUseCase);
  const appPasswordController = new AppPasswordController(prisma);

  // POST /api/auth/login - publico
  router.post(
    '/login',
    publicAuthRateLimit,
    (req, res, next) => authController.login(req, res, next),
  );

  // GET /api/auth/me - protegido
  router.get('/me', privateAuthRateLimit, authenticate(jwtService), (req, res) =>
    authController.me(req, res),
  );

  // ---- Application Passwords (protegidas, requer token de usuario) ----

  // GET /api/auth/app-passwords
  router.get(
    '/app-passwords',
    privateAuthRateLimit,
    authenticate(jwtService),
    requireUserToken,
    (req, res, next) => appPasswordController.list(req, res, next),
  );

  // POST /api/auth/app-passwords
  router.post(
    '/app-passwords',
    privateAuthRateLimit,
    authenticate(jwtService),
    requireUserToken,
    (req, res, next) => appPasswordController.create(req, res, next),
  );

  // DELETE /api/auth/app-passwords/:id
  router.delete(
    '/app-passwords/:id',
    privateAuthRateLimit,
    authenticate(jwtService),
    requireUserToken,
    (req, res, next) => appPasswordController.revoke(req, res, next),
  );

  return router;
}
