#!/usr/bin/env node

// ============================================
// GRAFIA CMS - SETUP RÁPIDO
// ============================================

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const colors = {
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  gray: (t) => `\x1b[90m${t}\x1b[0m`,
};

console.log(colors.bold(colors.cyan('\n🚀 Grafia CMS - Setup Rápido\n')));

async function setup() {
  const steps = [
    { name: 'Instalando dependências...', cmd: 'npm install --production' },
    { name: 'Gerando Prisma Client...', cmd: 'npm run db:generate --workspace=apps/api' },
    { name: 'Executando migrações...', cmd: 'npm run db:deploy --workspace=apps/api' },
    { name: 'Criando usuário admin...', cmd: 'node scripts/create-admin.js' },
    { name: 'Criando diretórios de dados...', cmd: null }
  ];

  for (const step of steps) {
    process.stdout.write(`  ${step.name} `);

    try {
      if (step.cmd) {
        execSync(step.cmd, { cwd: rootDir, stdio: 'ignore' });
      } else {
        await fs.mkdir(path.join(rootDir, 'data'), { recursive: true });
        await fs.mkdir(path.join(rootDir, 'logs'), { recursive: true });
        await fs.mkdir(path.join(rootDir, 'content/uploads'), { recursive: true });
      }
      console.log(colors.green('✅'));
    } catch (err) {
      console.log(colors.red('❌'));
      console.error(colors.red(`\n  Erro: ${err.message}`));
      process.exit(1);
    }
  }

  console.log(colors.green('\n✨ Grafia CMS pronto para uso!\n'));
  console.log(colors.gray('Para iniciar:'));
  console.log(colors.gray('  npm start          # Modo desenvolvimento'));
  console.log(colors.gray('  npm run pm2:start  # Modo produção\n'));
}

setup().catch((err) => {
  console.error(colors.red('❌ Erro durante o setup:'), err.message);
  process.exit(1);
});
