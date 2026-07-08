import { rateLimit } from 'express-rate-limit';

const fifteenMinutes = 15 * 60 * 1000;

export const publicAuthRateLimit = rateLimit({
  windowMs: fifteenMinutes,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas tentativas de autenticacao. Tente novamente mais tarde.',
});

export const privateAuthRateLimit = rateLimit({
  windowMs: fifteenMinutes,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisicoes autenticadas. Tente novamente mais tarde.',
});

export const publicUserRateLimit = rateLimit({
  windowMs: fifteenMinutes,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisicoes publicas para usuarios. Tente novamente mais tarde.',
});

export const privateUserRateLimit = rateLimit({
  windowMs: fifteenMinutes,
  limit: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisicoes autenticadas para usuarios. Tente novamente mais tarde.',
});

export const publicPostRateLimit = rateLimit({
  windowMs: fifteenMinutes,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisicoes publicas para posts. Tente novamente mais tarde.',
});

export const privatePostRateLimit = rateLimit({
  windowMs: fifteenMinutes,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisicoes autenticadas para posts. Tente novamente mais tarde.',
});