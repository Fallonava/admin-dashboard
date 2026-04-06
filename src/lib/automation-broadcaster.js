"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationBroadcaster = void 0;
exports.notifyDoctorUpdates = notifyDoctorUpdates;
exports.notifyViaSocket = notifyViaSocket;
var events_1 = require("events");
// simple in-memory broadcaster for doctor-update notifications
var Broadcaster = /** @class */ (function (_super) {
    __extends(Broadcaster, _super);
    function Broadcaster() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Broadcaster;
}(events_1.EventEmitter));

exports.automationBroadcaster = global.automationBroadcaster || new Broadcaster();

// Ensure it persists globally to bridge Next.js isolated API routes
if (!global.automationBroadcaster) {
    global.automationBroadcaster = exports.automationBroadcaster;
}
// helper to notify after automation run (in-process SSE only)
function notifyDoctorUpdates(updates) {
    exports.automationBroadcaster.emit('doctors', updates);
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
function notifyViaSocket(event, data) {
    try {
        var io = global.io;
        if (io) {
            io.emit(event, data !== null && data !== void 0 ? data : null);
        }
    }
    catch (_a) {
        // Graceful no-op if io is not yet available
    }
}

/**
 * Specialized sync for Admin Dashboard (Full Socket.io mode).
 * Call this to send the entire state snapshot to all connected admins.
 * @param {object} snapshot - { doctors, shifts, leaves, settings }
 */
function syncAdminData(snapshot) {
    notifyViaSocket('admin_sync_all', snapshot);
}

exports.syncAdminData = syncAdminData;
