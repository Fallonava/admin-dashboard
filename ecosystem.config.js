module.exports = {
  apps: [
    {
      name: 'medcore-admin',
      script: 'server.js',
      cwd: '/home/fallonava/admin-dashboard',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',

      // ── Environment Variables ──────────────────────────────────────────────
      // These vars are MERGED with vars already loaded from the .env file.
      // Secrets (DATABASE_URL, JWT_SECRET, etc.) are written to
      // /home/fallonava/admin-dashboard/.env by the deploy script — NOT here.
      //
      // Only put non-secret, deployment-level vars here.
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_APP_URL: 'https://medcore.fallonava.my.id',
      },

      // env_production mirrors env — needed to suppress PM2 warning when
      // started with `pm2 start ecosystem.config.js --env production`
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_APP_URL: 'https://medcore.fallonava.my.id',
      },

      // ── Production log config ──────────────────────────────────────────────
      error_file: '/home/fallonava/logs/medcore-error.log',
      out_file: '/home/fallonava/logs/medcore-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // ── Graceful shutdown ──────────────────────────────────────────────────
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 15000,

      // ── Restart policy ────────────────────────────────────────────────────
      // Exponential backoff: don't hammer the process if it's crash-looping
      exp_backoff_restart_delay: 100,
    },
    {
      name: 'medcore-cron-worker',
      script: 'server-cron.js',
      cwd: '/home/fallonava/admin-dashboard',
      instances: 1,
      exec_mode: 'fork',
      env_file: '.env',
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',

      // ── Environment Variables ──────────────────────────────────────────────
      env: {
        NODE_ENV: 'production',
      },

      // env_production mirrors env — needed to suppress PM2 warning
      env_production: {
        NODE_ENV: 'production',
      },

      // ── Production log config ──────────────────────────────────────────────
      error_file: '/home/fallonava/logs/medcore-cron-error.log',
      out_file: '/home/fallonava/logs/medcore-cron-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // ── Restart policy ────────────────────────────────────────────────────
      exp_backoff_restart_delay: 100,
    },
  ],
};
