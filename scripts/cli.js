#!/usr/bin/env node

// ============================================
// GRAFIA CMS - CLI (Linha de Comando)
// ============================================
// Uso: npx grafia [comando]
//   grafia install    - Instalação interativa
//   grafia setup      - Setup rápido
//   grafia start      - Iniciar servidor
//   grafia security   - Verificar segurança
// ============================================

import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const colors = {
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  gray: (t) => `\x1b[90m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
};

function showHelp() {
  console.log(colors.bold(colors.cyan('\n✍️  Grafia CMS - CLI\n')));
  console.log(colors.gray('Onde suas palavras ganham forma.\n'));
  console.log(colors.bold('Uso:'));
  console.log('  grafia <comando> [opções]\n');
  console.log(colors.bold('Comandos:'));
  console.log('  install        Instalação interativa (banco, admin, segurança)');
  console.log('  setup          Setup rápido (migrações, admin)');
  console.log('  start          Iniciar servidor');
  console.log('  security       Verificar configurações de segurança');
  console.log('  help           Mostrar esta ajuda\n');
  console.log(colors.bold('Opções do start:'));
  console.log('  --port         Porta do servidor (default: 3000)');
  console.log('  --env          Ambiente: development | production (default: production)\n');
  console.log(colors.bold('Exemplos:'));
  console.log('  grafia install           Iniciar instalação interativa');
  console.log('  grafia start             Iniciar servidor em produção');
  console.log('  grafia start --port 8080 Iniciar na porta 8080');
  console.log('  grafia security          Verificar segurança\n');
}

function runScript(scriptName, args = []) {
  const scriptPath = path.join(rootDir, 'scripts', scriptName);
  const env = { ...process.env };

  // Parse args
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' && args[i + 1]) {
      env.PORT = args[++i];
    } else if (arg === '--env' && args[i + 1]) {
      env.NODE_ENV = args[++i];
    }
  }

  try {
    execFileSync('node', [scriptPath], {
      cwd: rootDir,
      stdio: 'inherit',
      env
    });
  } catch (err) {
    process.exit(err.status || 1);
  }
}

// Main
const command = process.argv[2]?.toLowerCase();
const args = process.argv.slice(3);

switch (command) {
  case 'install':
    runScript('install.js', args);
    break;

  case 'setup':
    runScript('setup.js', args);
    break;

  case 'start':
    runScript('../server.js', args);
    break;

  case 'security':
    runScript('security-check.js', args);
    break;

  case 'help':
  case '--help':
  case '-h':
  default:
    showHelp();
    break;
}
