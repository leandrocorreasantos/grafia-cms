import { config } from 'dotenv';
import path from 'path';

// Usar .env.test se existir, senao .env
const envPath = path.resolve(__dirname, '..', '.env.test');
const envDefault = path.resolve(__dirname, '..', '.env');

config({ path: envPath });
if (!process.env.DATABASE_URL) {
  config({ path: envDefault });
}

// Garantir JWT_SECRET para testes
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-nao-use-em-producao';
}

// Desabilitar rate-limit durante testes para evitar bloqueios
process.env.DISABLE_RATE_LIMIT = 'true';

