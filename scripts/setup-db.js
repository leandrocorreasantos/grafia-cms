#!/usr/bin/env node

// ============================================
// GRAFIA CMS - CONFIGURAÇÃO DO BANCO
// ============================================
// Uso: node scripts/setup-db.js
// ============================================

import { execSync } from 'child_process';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

config({ path: path.join(rootDir, '.env') });

const colors = {
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  gray: (t) => `\x1b[90m${t}\x1b[0m`,
};

console.log(colors.bold(colors.cyan('\n🗄️  Grafia CMS - Configuração do Banco\n')));

async function setupDatabase() {
  // 1. Gerar Prisma Client
  process.stdout.write('  Gerando Prisma Client... ');
  try {
    execSync('npx prisma generate', { cwd: rootDir, stdio: 'ignore' });
    console.log(colors.green('✅'));
  } catch (err) {
    console.log(colors.red('❌'));
    console.error(colors.red(`  Erro: ${err.message}`));
    process.exit(1);
  }

  // 2. Verificar conexão
  process.stdout.write('  Verificando conexão com o banco... ');
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    console.log(colors.green('✅'));
  } catch (err) {
    console.log(colors.red('❌'));
    console.error(colors.red(`  Erro: ${err.message}`));
    console.log(colors.yellow('\n⚠️  Verifique se o banco está rodando e a DATABASE_URL no .env'));
    process.exit(1);
  }

  // 3. Executar migrações
  process.stdout.write('  Executando migrações... ');
  try {
    execSync('npx prisma migrate deploy', { cwd: rootDir, stdio: 'ignore' });
    console.log(colors.green('✅'));
  } catch (err) {
    // Se não houver migrations, criar a inicial
    try {
      execSync('npx prisma migrate dev --name init --skip-generate', {
        cwd: rootDir,
        stdio: 'ignore'
      });
      console.log(colors.green('✅ (migração inicial criada)'));
    } catch (err2) {
      console.log(colors.red('❌'));
      console.error(colors.red(`  Erro: ${err2.message}`));
      process.exit(1);
    }
  }

  console.log(colors.green('\n✅ Banco de dados configurado com sucesso!\n'));
}

setupDatabase().catch((err) => {
  console.error(colors.red('❌ Erro durante a configuração:'), err.message);
  process.exit(1);
});
