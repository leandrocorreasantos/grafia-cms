import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from '../../infrastructure/repositories/UserRepository';
import { UserController } from '../http/UserController';
import { JwtService } from '../../infrastructure/auth/JwtService';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { UserRole } from '../../domain/user/UserRole';
import {
  publicUserRateLimit,
  privateUserRateLimit,
} from '../middlewares/rateLimitMiddleware';

export function createUserRoutes(prisma: PrismaClient, jwtSecret: string): Router {
  const router = Router();
  const userRepository = new PrismaUserRepository(prisma);
  const userController = new UserController(userRepository);
  const jwtService = new JwtService(jwtSecret);

  // POST /api/users - publico (registro)
  router.post('/', publicUserRateLimit, (req, res, next) => userController.create(req, res, next));

  // GET /api/users - protegido (editor+)
  router.get(
    '/',
    privateUserRateLimit,
    authenticate(jwtService),
    requireRole(UserRole.EDITOR),
    (req, res, next) => userController.list(req, res, next),
  );

  // GET /api/users/:id - protegido (editor+)
  router.get(
    '/:id',
    privateUserRateLimit,
    authenticate(jwtService),
    requireRole(UserRole.EDITOR),
    (req, res, next) => userController.getById(req, res, next),
  );

  // DELETE /api/users/:id - protegido (admin)
  router.delete(
    '/:id',
    privateUserRateLimit,
    authenticate(jwtService),
    requireRole(UserRole.ADMIN),
    (req, res, next) => userController.delete(req, res, next),
  );

  return router;
}
