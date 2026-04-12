"use strict";
/**
 * automation-broadcaster.ts
 *
 * In-memory event emitter for real-time updates.
 */
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
exports.syncAdminData = syncAdminData;
exports.triggerSchedulerResync = triggerSchedulerResync;
var events_1 = require("events");
// Simple in-memory broadcaster
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
// Helper to notify after automation run
function notifyDoctorUpdates(updates) {
    exports.automationBroadcaster.emit('doctors', updates);
}
/**
 * Emit a Socket.IO event to connected clients.
 * Attaches to global.io which is set in server.ts.
 */
function notifyViaSocket(event, data) {
    try {
        var io = global.io;
        if (io) {
            io.emit(event, data !== null && data !== void 0 ? data : null);
        }
    }
    catch (_a) {
        // Graceful no-op
    }
}
/**
 * Specialized sync for Admin Dashboard.
 */
function syncAdminData(snapshot) {
    notifyViaSocket('admin_sync_all', snapshot);
}
/**
 * Trigger dynamic rescheduling.
 * Since we are in a single-instance environment on Windows,
 * we just call the trigger directly.
 */
function triggerSchedulerResync() {
    try {
        if (global.triggerScheduler) {
            global.triggerScheduler().catch(console.error);
        }
    }
    catch (e) {
        console.error('[broadcaster] Trigger resync error:', e);
    }
}
