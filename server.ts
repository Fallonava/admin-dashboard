import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { AsyncLocalStorage } from 'async_hooks';
// Next.js 16 internal checks expect this to be global in some environments
(globalThis as any).AsyncLocalStorage = AsyncLocalStorage;

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { scheduleToday } from './src/lib/scheduler';
import { runAutomation } from './src/lib/automation';
import { getFullSnapshot } from './src/lib/data-fetchers';
import { logger } from './src/lib/logger';

// Expose internal scheduling engine to isolated API routes
(global as any).triggerScheduler = scheduleToday;
(global as any).runAutomationNow = runAutomation;

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// In development, give Next.js internal compiler a separate internal port to prevent collision with custom httpServer
const app = next(dev ? { dev, hostname: '127.0.0.1', port: port + 1 } : { dev, hostname, port });
const handle = app.getRequestHandler();

// ── Snapshot In-Memory Cache (Debounce Reconnect Storms) ──
let cachedSnapshot: any = null;
let cachedSnapshotTime = 0;
const SNAPSHOT_CACHE_TTL_MS = 5000; // 5 seconds cache

async function getCachedOrFreshSnapshot() {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshotTime < SNAPSHOT_CACHE_TTL_MS) {
    return cachedSnapshot;
  }
  const fresh = await getFullSnapshot();
  cachedSnapshot = fresh;
  cachedSnapshotTime = now;
  return fresh;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    const pathname = parsedUrl.pathname;

    // Fast-path Direct Static Serving for clean professional URLs
    if (pathname === '/jadwal' || pathname === '/mobile') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      fs.createReadStream(path.join(process.cwd(), 'public', 'jadwal.html')).pipe(res);
      return;
    }
    if (pathname === '/tv') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      fs.createReadStream(path.join(process.cwd(), 'public', 'tv.html')).pipe(res);
      return;
    }

    handle(req, res, parsedUrl);
  });

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : dev ? ['http://localhost:3000', 'http://localhost:3005', 'http://127.0.0.1:3005'] : [];

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
      methods: ["GET", "POST"],
      credentials: allowedOrigins.length > 0,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Expose io globally for automation broadcaster
  (global as any).io = io;

  io.on('connection', async (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Send snapshot to client (cached to protect DB during reconnect storms)
    try {
      const snapshot = await getCachedOrFreshSnapshot();
      socket.emit('admin_sync_all', snapshot);
    } catch (err: any) {
      console.error(`[Socket.IO] Snapshot error for ${socket.id}:`, err.message);
    }

    // Explicit data sync request from Admin Dashboard
    socket.on('request_admin_sync', async () => {
      try {
        const snapshot = await getCachedOrFreshSnapshot();
        socket.emit('admin_sync_all', snapshot);
      } catch (err: any) {
        console.error(`[Socket.IO] Manual sync error for ${socket.id}:`, err.message);
      }
    });

    // Join specific rooms for granular subscriptions
    socket.on('join_room', (room) => {
      if (typeof room === 'string' && room.length < 50) {
        socket.join(room);
      }
    });

    // General broadcast for schedule updates
    socket.on('schedule_updated', (data) => {
      // Invalidate cache immediately on update
      cachedSnapshot = null;
      socket.broadcast.emit('schedule_changed', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port} (with Socket.IO enabled)`);
      if (process.send) {
        process.send('ready');
      }

      // ── Real-time Event-Driven Scheduler ──────────────────────────────────
      scheduleToday().catch((err) => {
        console.error('[scheduler] Failed to start:', err);
      });
    });
});
