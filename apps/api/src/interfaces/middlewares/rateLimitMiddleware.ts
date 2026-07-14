import { rateLimit } from 'express-rate-limit';

const fifteenMinutes = 15 * 60 * 1000;

/**
 * Quando DISABLE_RATE_LIMIT=true, cria um middleware no-op que apenas chama next().
 * Usado em testes para evitar bloqueios de rate-limit.
 */
function createRateLimit(options: {
  windowMs: number;
  limit: number;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  message: string;
}) {
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return (_req: any, _res: any, next: any) => next();
  }
  return rateLimit(options);
}

export const publicAuthRateLimit = createRateLimit({
  windowMs: fifteenMinutes,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas tentativas de autenticacao. Tente novamente mais tarde.',
});

export const privateAuthRateLimit = createRateLimit({
  windowMs: fifteenMinutes,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisicoes autenticadas. Tente novamente mais tarde.',
});

export const publicUserRateLimit = createRateLimit({
  windowMs: fifteenMinutes,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisicoes publicas para usuarios. Tente novamente mais tarde.',
});

export const privateUserRateLimit = createRateLimit({
  windowMs: fifteenMinutes,
  limit: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisicoes autenticadas para usuarios. Tente novamente mais tarde.',
});

export const publicPostRateLimit = createRateLimit({
  windowMs: fifteenMinutes,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisicoes publicas para posts. Tente novamente mais tarde.',
});

export const privatePostRateLimit = createRateLimit({
  windowMs: fifteenMinutes,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisicoes autenticadas para posts. Tente novamente mais tarde.',
});

export const privateMediaRateLimit = createRateLimit({
  windowMs: fifteenMinutes,
  limit: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisicoes autenticadas para media. Tente novamente mais tarde.',
});

export const uploadMediaRateLimit = createRateLimit({
  windowMs: fifteenMinutes,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitos uploads em pouco tempo. Tente novamente mais tarde.',
});