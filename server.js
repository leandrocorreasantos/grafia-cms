// ============================================
// GRAFIA CMS - SERVIDOR PRINCIPAL
// ============================================
// Uso: node server.js
//      npm start
//      npm run pm2:start (produção)
// ============================================

import express from 'express';
import { config } from 'dotenv';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carregar variáveis de ambiente
config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ============================================
// SEGURANÇA (módulos opcionais com fallback)
// ============================================

// Helmet - headers de segurança
try {
  const helmet = (await import('helmet')).default;
  app.use(helmet({
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.PUBLIC_URL || `http://localhost:${PORT}`]
      }
    } : false,
    frameguard: { action: 'sameorigin' }
  }));
} catch {
  console.log('  ⚠️  helmet não instalado (opcional)');
}

// Compression - Gzip
try {
  const compression = (await import('compression')).default;
  app.use(compression());
} catch {}

// CORS
try {
  const cors = (await import('cors')).default;
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
} catch {}

// Rate Limiting
try {
  const rateLimit = (await import('express-rate-limit')).default;

  const apiLimiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api', apiLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/auth/login', authLimiter);
} catch {}

// ============================================
// LOGS DE AUDITORIA (sem dados sensíveis)
// ============================================

app.use((req, res, next) => {
  const clientIP = req.headers['x-forwarded-for'] || req.ip;
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${req.method} ${req.path} - ${clientIP}\n`;

  fs.appendFile(
    path.join(__dirname, 'logs', 'access.log'),
    logLine,
    (err) => { if (err) console.error('Erro ao escrever log:', err.message); }
  );

  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Grafia CMS',
    version: process.env.npm_package_version || '0.1.0',
    environment: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API ROUTES
// ============================================

app.get('/api', (req, res) => {
  res.json({
    name: 'Grafia CMS API',
    version: process.env.npm_package_version || '0.1.0',
    endpoints: {
      posts: '/api/posts',
      users: '/api/users',
      auth: '/api/auth'
    }
  });
});

// ============================================
// STATIC FILES
// ============================================

// 1. Prioridade: build do frontend em dist/web
const webDistPath = path.join(__dirname, 'dist', 'web');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
}

// 2. Fallback: arquivos estáticos públicos
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// 3. Conteúdo do usuário (uploads)
const contentPath = path.join(__dirname, 'content');
if (fs.existsSync(contentPath)) {
  app.use('/content', express.static(contentPath));
}

// 4. SPA fallback - serve index.html para rotas não-API
const indexFile = fs.existsSync(path.join(webDistPath, 'index.html'))
  ? path.join(webDistPath, 'index.html')
  : path.join(publicPath, 'index.html');

if (fs.existsSync(indexFile)) {
  app.get(/^(?!\/api|\/health).*/, (req, res) => {
    res.sendFile(indexFile);
  });
}

// ============================================
// HANDLER DE ERROS GLOBAL
// ============================================

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  if (!isProduction) {
    console.error(err.stack);
  }

  fs.appendFile(
    path.join(__dirname, 'logs', 'error.log'),
    `[${new Date().toISOString()}] ${err.message}\n`,
    () => {}
  );

  res.status(err.status || 500).json({
    error: isProduction ? 'Erro interno do servidor' : err.message
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ✍️  Grafia CMS v${process.env.npm_package_version || '0.1.0'}`);
  console.log(`  ${isProduction ? '🚀 PRODUÇÃO' : '🧪 DESENVOLVIMENTO'}`);
  console.log(`  📍 http://localhost:${PORT}`);
  console.log(`${'='.repeat(50)}`);
  console.log(`\n📋 Endpoints:`);
  console.log(`  Health:  http://localhost:${PORT}/health`);
  console.log(`\n📁 Logs:   ./logs/`);
  console.log(`📁 Dados:  ./data/`);
  console.log(`📁 Upload: ./content/uploads/\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido SIGTERM. Encerrando gracefully...');
  server.close(() => {
    console.log('✅ Servidor encerrado.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Recebido SIGINT. Encerrando...');
  server.close(() => {
    console.log('✅ Servidor encerrado.');
    process.exit(0);
  });
});

// ============================================
// CRIAÇÃO DE DIRETÓRIOS
// ============================================

['logs', 'data', 'content/uploads', 'content/themes', 'content/plugins'].forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});
