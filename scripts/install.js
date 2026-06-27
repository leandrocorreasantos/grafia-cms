#!/usr/bin/env node

// ============================================
// GRAFIA CMS - INSTALADOR INTERATIVO
// ============================================

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash, randomBytes } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Cores para terminal (sem dependências externas)
const colors = {
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  gray: (t) => `\x1b[90m${t}\x1b[0m`,
};

function log(message) { console.log(message); }
function success(message) { console.log(colors.green(`✅ ${message}`)); }
function error(message) { console.log(colors.red(`❌ ${message}`)); }
function info(message) { console.log(colors.cyan(`ℹ️  ${message}`)); }

// ============================================
// HELPERS
// ============================================

function generateSecurePassword(length = 32) {
  return randomBytes(length).toString('hex').slice(0, length);
}

function generateJwtSecret() {
  return createHash('sha512')
    .update(randomBytes(64).toString('hex'))
    .digest('hex')
    .slice(0, 64);
}

async function prompt(question, defaultValue = '') {
  return new Promise((resolve) => {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const defaultText = defaultValue ? ` (${defaultValue})` : '';
    rl.question(`${question}${defaultText}: `, (answer) => {
      rl.close();
      resolve(answer || defaultValue);
    });
  });
}

async function promptPassword(question) {
  return new Promise((resolve) => {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`${question}: `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function promptSelect(question, choices) {
  console.log(`\n${question}:`);
  choices.forEach((choice, index) => {
    console.log(`  ${index + 1}. ${choice.name}`);
  });

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    const ask = () => {
      rl.question(`Escolha (1-${choices.length}): `, (answer) => {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < choices.length) {
          rl.close();
          resolve(choices[index].value);
        } else {
          console.log(colors.red('Opção inválida. Tente novamente.'));
          ask();
        }
      });
    };
    ask();
  });
}

// ============================================
// VERIFICAÇÕES
// ============================================

async function checkRequirements() {
  console.log(colors.bold(colors.cyan('\n✍️  Grafia CMS - Instalador\n')));
  console.log(colors.gray('Onde suas palavras ganham forma\n'));

  info('Verificando requisitos...');
  const issues = [];

  // Node.js
  const nodeVersion = process.version.match(/v(\d+)/)?.[1];
  if (!nodeVersion || parseInt(nodeVersion) < 18) {
    issues.push('Node.js 18+ é necessário (versão atual: ' + process.version + ')');
  } else {
    success(`Node.js ${process.version}`);
  }

  // npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    success(`npm ${npmVersion}`);
  } catch {
    issues.push('npm não encontrado');
  }

  if (issues.length > 0) {
    error('Requisitos não atendidos:');
    issues.forEach(i => console.log(colors.red(`  - ${i}`)));
    process.exit(1);
  }

  return true;
}

// ============================================
// CONFIGURAÇÕES
// ============================================

async function configureDatabase() {
  console.log(colors.bold('\n📊 Configuração do Banco de Dados\n'));

  const dbType = await promptSelect('Qual banco de dados você vai usar?', [
    { name: 'PostgreSQL (Recomendado)', value: 'postgresql' },
    { name: 'MySQL', value: 'mysql' },
    { name: 'SQLite (Para testes)', value: 'sqlite' }
  ]);

  let databaseUrl;
  let dbHost = 'localhost';
  let dbPort = '5432';
  let dbName = 'grafia_cms';
  let dbUser = 'grafia_user';
  let dbPassword = '';

  if (dbType === 'sqlite') {
    databaseUrl = 'file:./data/grafia.db';
    info('Usando SQLite local - ideal para desenvolvimento/testes');
  } else {
    dbHost = await prompt('Host do banco', 'localhost');
    dbPort = await prompt('Porta', dbType === 'postgresql' ? '5432' : '3306');
    dbName = await prompt('Nome do banco', 'grafia_cms');
    dbUser = await prompt('Usuário', 'grafia_user');
    dbPassword = await promptPassword('Senha');

    databaseUrl = `${dbType}://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;
  }

  return { databaseUrl, dbType, dbHost, dbPort, dbName, dbUser, dbPassword };
}

async function configureSite() {
  console.log(colors.bold('\n🌐 Configuração do Site\n'));

  const siteName = await prompt('Nome do site', 'Meu Blog Grafia');
  const siteUrl = await prompt('URL pública', 'http://localhost:3000');
  const siteDescription = await prompt('Descrição do site', 'Um blog criado com Grafia CMS');

  return { siteName, siteUrl, siteDescription };
}

async function configureAdmin() {
  console.log(colors.bold('\n👤 Configuração do Administrador\n'));

  const adminEmail = await prompt('Email do administrador', 'admin@grafia.com');
  const adminName = await prompt('Nome do administrador', 'Admin Grafia');
  
  let adminPassword = '';
  while (!adminPassword || adminPassword.length < 8) {
    adminPassword = await promptPassword('Senha (mínimo 8 caracteres)');
    if (adminPassword.length < 8) {
      error('A senha deve ter pelo menos 8 caracteres');
    }
  }

  return { adminEmail, adminName, adminPassword };
}

// ============================================
// CRIAÇÃO DE ARQUIVOS
// ============================================

async function createEnvFile(config) {
  info('Criando arquivo .env...');

  const envContent = `# ============================================
# GRAFIA CMS - CONFIGURAÇÃO
# Gerado em: ${new Date().toISOString()}
# ============================================

# --- Banco de Dados ---
DATABASE_URL="${config.databaseUrl}"
DB_TYPE="${config.dbType}"

# --- Segurança ---
JWT_SECRET="${config.jwtSecret}"
JWT_EXPIRES_IN="7d"
SESSION_SECRET="${config.sessionSecret}"
ENCRYPTION_KEY="${config.encryptionKey}"

# --- Admin ---
ADMIN_EMAIL="${config.adminEmail}"
ADMIN_NAME="${config.adminName}"
ADMIN_PASSWORD="${config.adminPassword}"

# --- Site ---
SITE_NAME="${config.siteName}"
SITE_URL="${config.siteUrl}"
SITE_DESCRIPTION="${config.siteDescription}"

# --- Aplicação ---
NODE_ENV="production"
PORT=3000
API_PORT=3001

# --- CORS ---
CORS_ORIGIN="${config.siteUrl}"

# --- Rate Limit ---
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# --- Público ---
PUBLIC_URL="${config.siteUrl}"
`;

  await fs.writeFile(path.join(rootDir, '.env'), envContent.trim());
  success('Arquivo .env criado com segurança!');
}

async function createDataDir() {
  try {
    await fs.mkdir(path.join(rootDir, 'data'), { recursive: true });
    await fs.mkdir(path.join(rootDir, 'logs'), { recursive: true });
    await fs.mkdir(path.join(rootDir, 'content/uploads'), { recursive: true });
    success('Diretórios de dados criados');
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// ============================================
// MIGRAÇÕES
// ============================================

async function runMigrations() {
  info('Executando migrações do banco de dados...');

  try {
    execSync('npx prisma generate', {
      cwd: rootDir,
      stdio: 'ignore'
    });
    success('Prisma Client gerado');
  } catch (err) {
    error('Erro ao gerar Prisma Client');
    throw err;
  }

  try {
    execSync('npx prisma migrate deploy', {
      cwd: rootDir,
      stdio: 'ignore'
    });
    success('Migrações executadas');
  } catch (err) {
    // Se não houver migrations ainda, tentar criar
    try {
      execSync('npx prisma migrate dev --name init --skip-generate', {
        cwd: rootDir,
        stdio: 'ignore'
      });
      success('Migração inicial criada e executada');
    } catch (err2) {
      error('Erro ao executar migrações');
      throw err2;
    }
  }
}

async function createAdminUser() {
  info('Criando usuário administrador...');

  try {
    execSync('node scripts/create-admin.js', {
      cwd: rootDir,
      stdio: 'ignore'
    });
    success('Usuário administrador criado');
  } catch (err) {
    error('Erro ao criar usuário admin');
    throw err;
  }
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function main() {
  try {
    // 1. Verificar requisitos
    await checkRequirements();

    // 2. Configurar banco de dados
    const dbConfig = await configureDatabase();

    // 3. Configurar site
    const siteConfig = await configureSite();

    // 4. Configurar admin
    const adminConfig = await configureAdmin();

    // 5. Gerar chaves de segurança
    const jwtSecret = generateJwtSecret();
    const sessionSecret = generateJwtSecret();
    const encryptionKey = generateSecurePassword(32);

    // 6. Criar diretórios
    await createDataDir();

    // 7. Criar .env
    await createEnvFile({
      ...dbConfig,
      ...siteConfig,
      ...adminConfig,
      jwtSecret,
      sessionSecret,
      encryptionKey
    });

    // 8. Executar migrações
    await runMigrations();

    // 9. Criar usuário admin
    await createAdminUser();

    // 10. Finalizar
    console.log(colors.bold(colors.green('\n✅ Grafia CMS instalado com sucesso!\n')));
    console.log(colors.bold('🔐 Credenciais de acesso:'));
    console.log(colors.gray(`  Email: ${adminConfig.adminEmail}`));
    console.log(colors.gray(`  Senha: [definida durante a instalação]`));
    console.log(colors.gray(`  URL: ${siteConfig.siteUrl}\n`));

    console.log(colors.bold('🚀 Para iniciar:'));
    console.log(colors.gray('  npm start'));
    console.log(colors.gray('  ou'));
    console.log(colors.gray('  npm run pm2:start  # Para produção\n'));

    console.log(colors.yellow('⚠️  Guarde suas credenciais em local seguro!'));
    console.log(colors.yellow('⚠️  Configure HTTPS em produção!'));

  } catch (err) {
    console.error(colors.red('\n❌ Erro durante a instalação:'), err.message);
    process.exit(1);
  }
}

main();
