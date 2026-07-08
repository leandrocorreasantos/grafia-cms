import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from '../../infrastructure/auth/JwtService';
import { UserRole, hasMinRole } from '../../domain/user/UserRole';
import { AuthenticationError, AuthorizationError } from '../../domain/errors/DomainError';

// Estende o Request do Express para incluir o usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware que exige autenticacao.
 * Extrai e valida o token JWT do header Authorization.
 */
export function authenticate(jwtService: JwtService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new AuthenticationError('Token nao fornecido');
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new AuthenticationError('Formato de token invalido. Use: Bearer <token>');
      }

      const payload = jwtService.verifyToken(parts[1]);
      req.user = payload;
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        next(error);
      } else {
        next(new AuthenticationError('Token invalido ou expirado'));
      }
    }
  };
}

/**
 * Middleware que tenta autenticar sem bloquear acesso quando nao ha token.
 * Se houver token, ele precisa ser valido.
 */
export function authenticateOptional(jwtService: JwtService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        next();
        return;
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new AuthenticationError('Formato de token invalido. Use: Bearer <token>');
      }

      const payload = jwtService.verifyToken(parts[1]);
      req.user = payload;
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        next(error);
      } else {
        next(new AuthenticationError('Token invalido ou expirado'));
      }
    }
  };
}

/**
 * Middleware que exige um cargo minimo para acessar a rota.
 * Deve ser usado APOS o middleware `authenticate`.
 */
export function requireRole(minRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Autenticacao necessaria'));
      return;
    }

    if (!hasMinRole(req.user.role, minRole)) {
      next(
        new AuthorizationError(
          `Acesso restrito a cargos ${minRole} ou superior. Seu cargo: ${req.user.role}`,
        ),
      );
      return;
    }

    next();
  };
}

/**
 * Middleware que permite apenas tokens do tipo 'user' (nao application password).
 * Util para acoes sensiveis como gerenciar senhas de aplicacao.
 */
export function requireUserToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    next(new AuthenticationError('Autenticacao necessaria'));
    return;
  }

  if (req.user.type === 'application') {
    next(
      new AuthorizationError(
        'Esta acao requer autenticacao com senha do usuario, nao com Application Password',
      ),
    );
    return;
  }

  next();
}
