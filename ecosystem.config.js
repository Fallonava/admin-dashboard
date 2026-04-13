module.exports = {
  apps: [
    {
      name: 'admin-dashboard',
      script: 'server.js',
      cwd: 'C:\\simed-production',
      instances: 2,                   // Reduced from 'max' to stabilize 8GB RAM usage
      exec_mode: 'cluster',           // Enable load balancing layer
      autorestart: true,
      watch: false,

      // ── Memory Management ──────────────────────────────────────────────────
      // 400M is often too restrictive for Next.js with active WebSockets/SSR.
      // Enterprise standard is typically 800M - 1G per worker based on Server spec.
      max_memory_restart: '1G',
      // Explicitly limit V8 Garbage Collector to prevent OS-level Out Of Memory (OOM)
      // keeping it matching or slightly below max_memory_restart
      node_args: '--max_old_space_size=1024',

      // ── Environment Variables ──────────────────────────────────────────────
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_APP_URL: 'https://simed.fallonava.my.id',
        TZ: 'Asia/Jakarta',           // Guarantee consistent timezone across cluster
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_APP_URL: 'https://simed.fallonava.my.id',
        TZ: 'Asia/Jakarta',
      },

      // ── Logging Config ─────────────────────────────────────────────────────
      error_file: 'C:\\simed-production\\logs\\admin-error.log',
      out_file: 'C:\\simed-production\\logs\\admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,               // Aggregate all cluster worker logs into one file
      time: true,                     // Prefix logs with standardized timestamp

      // ── Zero-Downtime Reloads & Graceful Shutdown ──────────────────────────
      wait_ready: true,               // PM2 waits for process.send('ready') from Next.js server
      listen_timeout: 30000,          // 30s timeout for app to boot and send 'ready' signal
      kill_timeout: 10000,            // 10s to let active requests and DB queries finish gracefully before SIGKILL

      // ── Stability & Backoff Settings ───────────────────────────────────────
      exp_backoff_restart_delay: 200, // Starts at 200ms, increases exponentially upon rapid crashes
      min_uptime: '60s',              // App must stay up for 60s to be considered "healthy"
      max_restarts: 10,               // Stop thrashing CPU/Disk if app crashes 10 times in a row
    },
    {
      name: 'wa-worker',
      script: './wa-bot/index.js',
      cwd: 'C:\\simed-production',
      instances: 1,                   // MUST BE 1 (Singleton) to prevent headless chromium wars
      exec_mode: 'fork',              // MUST BE fork mode for headless chromium stability
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        TZ: 'Asia/Jakarta',
      },
      error_file: 'C:\\simed-production\\logs\\wa-worker-error.log',
      out_file: 'C:\\simed-production\\logs\\wa-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      exp_backoff_restart_delay: 2000, // Waits 2s before restart loop
    }
  ],
};
