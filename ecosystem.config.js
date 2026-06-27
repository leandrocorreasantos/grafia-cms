// ============================================
// GRAFIA CMS - PM2 CONFIGURAÇÃO
// ============================================
// Para produção com gerenciamento de processos
// Uso: pm2 start ecosystem.config.js
// ============================================

module.exports = {
  apps: [{
    name: 'grafia-cms',
    script: 'server.js',
    instances: process.env.WEB_CONCURRENCY || 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',

    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // Logs
    error_file: './logs/grafia-err.log',
    out_file: './logs/grafia-out.log',
    log_file: './logs/grafia-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Auto-restart
    min_uptime: '10s',
    max_restarts: 10,

    // Graceful shutdown
    listen_timeout: 5000,
    kill_timeout: 3000,

    // Métricas (opcional)
    metrics: false
  }]
};
