import 'dotenv/config';
import { AsyncLocalStorage } from 'async_hooks';
// Next.js 16 internal checks expect this to be global in some environments
(globalThis as any).AsyncLocalStorage = AsyncLocalStorage;

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { scheduleToday } from './src/lib/scheduler';
import { runAutomation } from './src/lib/automation';

// Expose internal scheduling engine to isolated API routes
(global as any).triggerScheduler = scheduleToday;
(global as any).runAutomationNow = runAutomation;

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
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

  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL && !dev) {
    console.warn("[Socket.IO] REDIS_URL not found. Running in Single-Node Mode (Cluster not synced).");
  }

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : false,
      methods: ["GET", "POST"],
      credentials: true,
    }
  });

  // Setup Redis Adapter if URL is provided
  if (REDIS_URL) {
    const pubClient = createClient({ url: REDIS_URL });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log("[Socket.IO] Redis adapter connected and ready!");

      // Listen for inter-process triggers from Next.js API routes
      subClient.subscribe('medcore:scheduler_sync', (message) => {
        try {
          if (message === 'sync') {
            console.log('[scheduler] Received sync event via Redis Pub/Sub, resyncing...');
            scheduleToday().catch(err => console.error('Redis triggered scheduleToday error:', err));
          }
        } catch (e) {
          console.error('[scheduler] Sync event error', e);
        }
      });

    }).catch((err) => {
      console.error("[Socket.IO] Redis connection error:", err);
    });
  }

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

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

  // Make IO globally available to API routes if needed, 
  // though it's better to keep websocket logic strictly in client or emitting from client
  (global as any).io = io;

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

