import { EventEmitter } from 'events';

// simple in-memory broadcaster for doctor-update notifications
class Broadcaster extends EventEmitter {}

export const automationBroadcaster = new Broadcaster();

// helper to notify after automation run (in-process SSE only)
export function notifyDoctorUpdates(updates: Array<{ id: string | number }>) {
    automationBroadcaster.emit('doctors', updates);
}

/**
 * Emit a Socket.IO event to ALL connected clients across ALL cluster instances.
 * Works because server.ts attaches the `io` instance to `global` AND uses
 * the Redis adapter (Upstash) to bridge between cluster instances.
 *
 * Call this from API routes after any data mutation so every browser tab
 * (regardless of which PM2 instance they're connected to) gets notified.
 *
 * @param event  Socket.IO event name — must match what SWRProvider listens for
 * @param data   Optional payload (serialisable)
 */
export function notifyViaSocket(event: string, data?: unknown) {
    try {
        const io = (global as any).io;
        if (io) {
            io.emit(event, data ?? null);
        }
    } catch {
        // Graceful no-op if io is not yet available
    }
}
