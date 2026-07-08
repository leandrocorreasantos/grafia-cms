import { Request, Response, NextFunction } from 'express';
import {
  DomainError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from '../../domain/errors/DomainError';
import {
  InvalidEmailError,
  InvalidNameError,
  InvalidRoleError,
  WeakPasswordError,
} from '../../domain/user/User';

/**
 * Middleware global de tratamento de erros.
 * Mapeia erros de dominio para respostas HTTP apropriadas.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Erros de validacao de dominio
  if (
    err instanceof InvalidEmailError ||
    err instanceof InvalidNameError ||
    err instanceof WeakPasswordError ||
    err instanceof InvalidRoleError
  ) {
    res.status(400).json({ error: err.message });
    return;
  }

  // Erro de autenticacao
  if (err instanceof AuthenticationError) {
    res.status(401).json({ error: err.message });
    return;
  }

  // Erro de autorizacao
  if (err instanceof AuthorizationError) {
    res.status(403).json({ error: err.message });
    return;
  }

  // Nao encontrado
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  // Conflito
  if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message });
    return;
  }

  // Outros erros de dominio
  if (err instanceof DomainError) {
    res.status(400).json({ error: err.message });
    return;
  }

  // Erros nao mapeados (genericos)
  console.error('[ERROR]', err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: 'Erro interno do servidor',
    ...(isDev && { details: err.message, stack: err.stack }),
  });
}
