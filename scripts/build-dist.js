#!/usr/bin/env node

// ============================================
// GRAFIA CMS - BUILD DE DISTRIBUIÇÃO
// ============================================
// Compila os workspaces e copia para dist/
// ============================================

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const colors = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  gray: (t) => `\x1b[90m${t}\x1b[0m`,
};

async function build() {
  console.log(colors.cyan('\n📦 Grafia CMS - Build de Distribuição\n'));

  // 1. Compilar workspaces
  process.stdout.write('  Compilando workspaces... ');
  try {
    execSync('npm run build --workspaces', { cwd: rootDir, stdio: 'ignore' });
    console.log(colors.green('✅'));
  } catch (err) {
    console.log(colors.red('❌'));
    console.error(colors.red(`  Erro: ${err.message}`));
    process.exit(1);
  }

  // 2. Copiar API compilada para dist/api
  process.stdout.write('  Copiando API para dist/api... ');
  try {
    await fs.cp(path.join(rootDir, 'apps/api/dist'), path.join(rootDir, 'dist/api'), { recursive: true });
    console.log(colors.green('✅'));
  } catch (err) {
    console.log(colors.gray('⚠️  (API não compilada ainda)'));
  }

  // 3. Copiar Web compilada para dist/web
  process.stdout.write('  Copiando Web para dist/web... ');
  try {
    const webOutDir = path.join(rootDir, 'apps/web/.next');
    if (await fs.stat(webOutDir).then(() => true).catch(() => false)) {
      await fs.cp(webOutDir, path.join(rootDir, 'dist/web'), { recursive: true });
    }
    console.log(colors.green('✅'));
  } catch (err) {
    console.log(colors.gray('⚠️  (Web não compilada ainda)'));
  }

  // 4. Gerar Prisma Client
  process.stdout.write('  Gerando Prisma Client... ');
  try {
    execSync('npm run db:generate --workspace=apps/api', { cwd: rootDir, stdio: 'ignore' });
    console.log(colors.green('✅'));
  } catch (err) {
    console.log(colors.red('❌'));
    console.error(colors.red(`  Erro: ${err.message}`));
    process.exit(1);
  }

  console.log(colors.green('\n✅ Build concluído!\n'));
  console.log(colors.gray('  dist/'));
  console.log(colors.gray('  ├── api/     (API compilada)'));
  console.log(colors.gray('  ├── web/     (Frontend compilado)'));
  console.log(colors.gray('  └── shared/  (Tipos compartilhados)\n'));
}

build().catch((err) => {
  console.error(colors.red('❌ Erro durante o build:'), err.message);
  process.exit(1);
});
