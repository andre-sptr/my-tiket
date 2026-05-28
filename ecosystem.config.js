// PM2 config — myTiket (full native, no Docker)
//
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 reload all
//   pm2 logs mytiket-backend
//   pm2 logs mytiket-frontend
//
// RAM budget (VPS 2 GB, ~770 MB free):
//   frontend: max 350 MB
//   backend:  max 450 MB (termasuk Playwright Chromium saat scraping)
//   Total:    ~800 MB peak — sengaja dekat batas, monitor pakai `pm2 monit`

const path = require('path');

module.exports = {
  apps: [
    // ── Frontend (Next.js) ──────────────────────────────
    {
      name: 'mytiket-frontend',
      cwd: path.join(__dirname, 'frontend'),
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '350M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_TELEMETRY_DISABLED: 1,
        BACKEND_URL: 'http://127.0.0.1:4000',
      },
      error_file: path.join(__dirname, 'logs/frontend-error.log'),
      out_file: path.join(__dirname, 'logs/frontend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },

    // ── Backend (Fastify + BullMQ worker in-process) ───
    {
      name: 'mytiket-backend',
      cwd: path.join(__dirname, 'backend'),
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '450M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: path.join(__dirname, 'logs/backend-error.log'),
      out_file: path.join(__dirname, 'logs/backend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
