import { EventEmitter } from 'events';

// simple in-memory broadcaster for doctor-update notifications
class Broadcaster extends EventEmitter {}

export const automationBroadcaster = new Broadcaster();

// helper to notify after automation run
export function notifyDoctorUpdates(updates: Array<{ id: string | number }>) {
    automationBroadcaster.emit('doctors', updates);
}
