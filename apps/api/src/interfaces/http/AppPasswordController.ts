import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

export class AppPasswordController {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Lista as senhas de aplicacao do usuario autenticado.
   * Retorna apenas metadados (nunca o hash).
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Nao autenticado' });
        return;
      }

      const passwords = await (this.prisma as any).applicationPassword.findMany({
        where: { userId: req.user.sub },
        select: { id: true, name: true, lastUsedAt: true, createdAt: true, expiresAt: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json(passwords);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria uma nova senha de aplicacao.
   * Retorna a senha gerada (texto puro) apenas UMA vez.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Nao autenticado' });
        return;
      }
      const { name, expiresInDays } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        res.status(400).json({
          error: 'Nome da aplicacao deve ter pelo menos 2 caracteres',
        });
        return;
      }

      // Gera senha aleatoria de 24 caracteres
      const rawPassword = crypto
        .randomBytes(18)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 24);
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const appPassword = await (this.prisma as any).applicationPassword.create({
        data: {
          userId: req.user.sub,
          name: name.trim(),
          passwordHash,
          expiresAt,
        },
      });

      res.status(201).json({
        id: appPassword.id,
        name: appPassword.name,
        password: rawPassword, // Unica vez que a senha e exibida
        expiresAt: appPassword.expiresAt,
        createdAt: appPassword.createdAt,
        warning:
          'Guarde esta senha em local seguro. Ela nao sera exibida novamente.',
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(409).json({
          error: `Ja existe uma senha de aplicacao com o nome "${req.body.name}"`,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Revoga (deleta) uma senha de aplicacao.
   */
  async revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Nao autenticado' });
        return;
      }

      const { id } = req.params;

      // Validar que o ID e um UUID valido antes de consultar o banco
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(404).json({ error: 'Senha de aplicacao nao encontrada' });
        return;
      }

      const record = await (this.prisma as any).applicationPassword.findUnique({
        where: { id },
      });

      if (!record) {
        res.status(404).json({ error: 'Senha de aplicacao nao encontrada' });
        return;
      }
      if (record.userId !== req.user.sub) {
        res.status(403).json({ error: 'Esta senha pertence a outro usuario' });
        return;
      }

      await (this.prisma as any).applicationPassword.delete({ where: { id } });
      res.json({ message: 'Senha de aplicacao revogada com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}

