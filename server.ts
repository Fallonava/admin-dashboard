import 'dotenv/config';
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
const hostname = process.env.HOSTNAME || (dev ? 'localhost' : '0.0.0.0');
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : dev ? ['http://localhost:3000'] : [];

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
      methods: ["GET", "POST"],
      credentials: allowedOrigins.length > 0,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // CRITICAL: Expose io globally BEFORE any async operations
  // so that automation-broadcaster.js can immediately use it
  (global as any).io = io;

  io.on('connection', async (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Send initial snapshot to Admin clients immediately
    try {
      console.log(`[Socket.IO] Generating initial snapshot for ${socket.id}...`);
      const snapshot = await getFullSnapshot();
      console.log(`[Socket.IO] Snapshot ready: ${snapshot.doctors.length} doctors. Sending...`);
      socket.emit('admin_sync_all', snapshot);
    } catch (err: any) {
      console.error(`[Socket.IO] Snapshot error for ${socket.id}:`, err.message);
    }

    // Explicit data sync request from Admin Dashboard
    socket.on('request_admin_sync', async () => {
      console.log(`[Socket.IO] Manual sync requested by ${socket.id}`);
      try {
        const snapshot = await getFullSnapshot();
        console.log(`[Socket.IO] Sending manual sync: ${snapshot.doctors.length} doctors`);
        socket.emit('admin_sync_all', snapshot);
      } catch (err: any) {
        console.error(`[Socket.IO] Manual sync error for ${socket.id}:`, err.message);
      }
    });

    // Join specific rooms for granular subscriptions
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`[Socket.IO] ${socket.id} joined room: ${room}`);
    });

    // General broadcast for schedule updates
    socket.on('schedule_updated', (data) => {
      // Broadcast to everyone else that schedule was updated
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
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port} (with Socket.IO enabled)`);
      if (process.send) {
        process.send('ready');
      }

      // ── Real-time Event-Driven Scheduler ──────────────────────────────────
      // Replaces the separate cron daemon (medcore-cron-worker PM2 process).
      // Schedules setTimeout triggers for each shift start/end event today
      // and recalculates at midnight. Much more precise than per-minute polling.
      scheduleToday().catch((err) => {
        console.error('[scheduler] Failed to start:', err);
      });
    });
});
