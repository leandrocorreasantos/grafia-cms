#!/usr/bin/env node

// ============================================
// GRAFIA CMS - VERIFICAÇÃO DE SEGURANÇA
// ============================================

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

config({ path: path.join(rootDir, '.env') });

const colors = {
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  gray: (t) => `\x1b[90m${t}\x1b[0m`,
};

console.log(colors.bold(colors.cyan('\n🔒 Grafia CMS - Verificação de Segurança\n')));

const checks = [];
let hasErrors = false;

async function runChecks() {
  // 1. Verificar .env
  try {
    await fs.access(path.join(rootDir, '.env'));
    checks.push({ name: 'Arquivo .env existe', status: '✅' });

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      checks.push({
        name: 'JWT_SECRET com tamanho adequado',
        status: '⚠️',
        message: 'Aumente a segurança: gere uma chave com pelo menos 32 caracteres'
      });
      hasErrors = true;
    }
  } catch {
    checks.push({ name: 'Arquivo .env existe', status: '❌', message: 'Crie um arquivo .env' });
    hasErrors = true;
  }

  // 2. Verificar permissões de arquivos sensíveis
  const sensitiveFiles = ['.env'];
  for (const file of sensitiveFiles) {
    try {
      const stats = await fs.stat(path.join(rootDir, file));
      const permissions = stats.mode & 0o777;
      if (permissions & 0o004) {
        checks.push({
          name: `Permissões restritas: ${file}`,
          status: '⚠️',
          message: `Arquivo legível por outros. Execute: chmod 640 ${file}`
        });
        hasErrors = true;
      }
    } catch {
      // Arquivo não encontrado - já reportado acima
    }
  }

  // 3. Verificar NODE_ENV
  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    checks.push({
      name: 'NODE_ENV=production',
      status: '⚠️',
      message: 'Defina NODE_ENV=production para ambiente de produção'
    });
    hasErrors = true;
  }

  // 4. Verificar versão do Node.js
  const nodeVersion = process.version.match(/v(\d+)/)?.[1];
  if (nodeVersion && parseInt(nodeVersion) < 18) {
    checks.push({
      name: 'Node.js versão mínima',
      status: '❌',
      message: `Node.js 18+ recomendado (atual: ${process.version})`
    });
    hasErrors = true;
  }

  // 5. Verificar conexão com banco
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    checks.push({ name: 'Conexão com banco de dados', status: '✅' });
  } catch {
    checks.push({ name: 'Conexão com banco de dados', status: '❌', message: 'Verifique DATABASE_URL no .env' });
    hasErrors = true;
  }

  // 6. Verificar se HTTPS está configurado
  const publicUrl = process.env.PUBLIC_URL || process.env.SITE_URL || '';
  if (publicUrl && !publicUrl.startsWith('https') && process.env.NODE_ENV === 'production') {
    checks.push({
      name: 'HTTPS configurado',
      status: '⚠️',
      message: 'Use HTTPS em produção. Configure um proxy reverso (nginx, Apache)'
    });
  }

  // Exibir resultados
  checks.forEach(check => {
    const icon = check.status === '✅' ? colors.green(' ✅ ') :
                 check.status === '❌' ? colors.red(' ❌ ') :
                 colors.yellow(' ⚠️ ');
    console.log(`${icon} ${check.name}`);
    if (check.message) {
      console.log(colors.gray(`   → ${check.message}`));
    }
  });

  // Resumo
  console.log('\n' + colors.bold('📊 Resumo:'));
  const passed = checks.filter(c => c.status === '✅').length;
  const warnings = checks.filter(c => c.status === '⚠️').length;
  const failures = checks.filter(c => c.status === '❌').length;

  console.log(colors.green(`  ✅ ${passed} verificações passaram`));
  if (warnings > 0) console.log(colors.yellow(`  ⚠️  ${warnings} avisos`));
  if (failures > 0) console.log(colors.red(`  ❌ ${failures} falhas`));

  if (hasErrors) {
    console.log(colors.red('\n❌ Existem problemas de segurança que precisam ser corrigidos.'));
    process.exit(1);
  } else {
    console.log(colors.green('\n✅ Tudo seguro!'));
  }

  // Recomendações
  console.log(colors.bold('\n📋 Recomendações de Segurança:'));
  const recommendations = [
    'Use HTTPS em produção (Let\'s Encrypt, Cloudflare)',
    'Mantenha o Node.js atualizado',
    'Faça backups regulares do banco de dados',
    'Monitore logs de acesso em ./logs/',
    'Use firewall (UFW no Linux, ou firewall do provedor)',
    'Atualize dependências regularmente: npm outdated && npm update',
    'Configure fail2ban para proteção contra brute force',
    'Nunca commite o arquivo .env no repositório'
  ];
  recommendations.forEach(r => console.log(colors.gray(`  • ${r}`)));
  console.log();
}

runChecks().catch((err) => {
  console.error(colors.red('Erro na verificação:'), err.message);
  process.exit(1);
});
