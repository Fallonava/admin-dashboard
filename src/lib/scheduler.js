"use strict";
/**
 * scheduler.ts
 *
 * Event-driven real-time scheduler sebagai pengganti cron daemon.
 *
 * Cara kerja:
 * 1. Saat dipanggil, baca semua jadwal shift dari DB untuk hari ini.
 * 2. Hitung milidetik tepat sampai setiap event (shift mulai, shift selesai).
 * 3. Jadwalkan setTimeout presisi untuk setiap event.
 * 4. Saat setTimeout terpicu → jalankan runAutomation() → broadcast via Socket.IO.
 * 5. Tengah malam: reschedule untuk hari berikutnya.
 *
 * Keunggulan vs cron per-menit:
 * - Status berubah tepat di detik yang benar (tidak ada delay 0–59 detik)
 * - Zero polling — hanya berjalan saat ada event yang terjadwal
 * - Tidak perlu proses PM2 kedua
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleToday = scheduleToday;
var prisma_1 = require("./prisma");
var automation_1 = require("./automation");
var automation_broadcaster_1 = require("./automation-broadcaster");
var logger_1 = require("./logger");
// Kumpulan semua timer aktif agar bisa dibersihkan saat reschedule
var activeTimers = [];
/**
 * Parse waktu "HH:MM" atau "H AM/PM" ke menit sejak tengah malam.
 */
function parseToMinutes(timeStr) {
    if (!timeStr)
        return null;
    var t = timeStr.trim().toLowerCase();
    var ampm = t.match(/(am|pm)$/);
    var cleaned = t.replace(/\s*(am|pm)$/, '').replace('.', ':');
    var parts = cleaned.split(':');
    if (parts.length < 2)
        return null;
    var h = parseInt(parts[0]);
    var m = parseInt(parts[1]);
    if (isNaN(h) || isNaN(m))
        return null;
    if (ampm) {
        if (ampm[1] === 'pm' && h < 12)
            h += 12;
        if (ampm[1] === 'am' && h === 12)
            h = 0;
    }
    return h * 60 + m;
}
/**
 * Get current WIB (UTC+7) time in minutes since midnight.
 */
function getNowWIBMinutes() {
    var wib = new Date(Date.now() + 7 * 3600000);
    return wib.getUTCHours() * 60 + wib.getUTCMinutes();
}
/**
 * Milliseconds remaining until a given minute-of-day (WIB).
 * Returns null if the time is already passed today.
 */
function msUntilMinute(targetMinutes) {
    var now = Date.now();
    var wib = new Date(now + 7 * 3600000);
    var todayMidnightMs = Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - 7 * 3600000; // back to UTC epoch for actual scheduling
    var targetMs = todayMidnightMs + targetMinutes * 60000;
    var delta = targetMs - now;
    return delta > 0 ? delta : null;
}
/**
 * Trigger the automation engine and broadcast results via Socket.IO.
 */
function triggerAndBroadcast(reason) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, applied, failed, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    logger_1.logger.info("[scheduler] Triggered: ".concat(reason));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, automation_1.runAutomation)()];
                case 2:
                    _a = _b.sent(), applied = _a.applied, failed = _a.failed;
                    logger_1.logger.info("[scheduler] Done. Applied: ".concat(applied, ", Failed: ").concat(failed));
                    if (applied > 0) {
                        (0, automation_broadcaster_1.notifyViaSocket)('schedule_changed', { reason: reason, applied: applied, ts: Date.now() });
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _b.sent();
                    logger_1.logger.error('[scheduler] runAutomation error:', err_1.message);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Clear all pending timers.
 */
function clearAllTimers() {
    for (var _i = 0, activeTimers_1 = activeTimers; _i < activeTimers_1.length; _i++) {
        var t = activeTimers_1[_i];
        clearTimeout(t);
    }
    activeTimers.length = 0;
}
/**
 * Schedule timers for today's shift events.
 * Called on startup and at midnight.
 */
function scheduleToday() {
    return __awaiter(this, void 0, void 0, function () {
        var wib, dayIdx, todayStr, shifts, err_2, triggerMinutes, _i, shifts_1, shift, _a, startStr, endStr, start, end, scheduled, _loop_1, _b, _c, minutes, msUntilMidnight, midnightTimer;
        var _this = this;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    clearAllTimers();
                    wib = new Date(Date.now() + 7 * 3600000);
                    dayIdx = wib.getUTCDay() === 0 ? 6 : wib.getUTCDay() - 1;
                    todayStr = "".concat(wib.getUTCFullYear(), "-").concat(String(wib.getUTCMonth() + 1).padStart(2, '0'), "-").concat(String(wib.getUTCDate()).padStart(2, '0'));
                    logger_1.logger.info("[scheduler] Scheduling for today (dayIdx=".concat(dayIdx, ", date=").concat(todayStr, ")"));
                    shifts = [];
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, prisma_1.prisma.shift.findMany({
                            where: { dayIdx: dayIdx, deletedAt: null },
                        })];
                case 2:
                    shifts = _f.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _f.sent();
                    logger_1.logger.error('[scheduler] Failed to load shifts:', err_2.message);
                    return [2 /*return*/];
                case 4:
                    triggerMinutes = new Set();
                    for (_i = 0, shifts_1 = shifts; _i < shifts_1.length; _i++) {
                        shift = shifts_1[_i];
                        if (!shift.formattedTime)
                            continue;
                        // Skip if today is a disabled date
                        if ((shift.disabledDates || []).includes(todayStr))
                            continue;
                        _a = shift.formattedTime.split('-'), startStr = _a[0], endStr = _a[1];
                        start = parseToMinutes(startStr);
                        end = parseToMinutes(endStr);
                        if (start !== null)
                            triggerMinutes.add(start);
                        if (end !== null)
                            triggerMinutes.add(end);
                    }
                    scheduled = 0;
                    _loop_1 = function (minutes) {
                        var ms = msUntilMinute(minutes);
                        if (ms === null)
                            return "continue"; // already passed, skip
                        var h = String(Math.floor(minutes / 60)).padStart(2, '0');
                        var m = String(minutes % 60).padStart(2, '0');
                        var label = "shift event at ".concat(h, ":").concat(m);
                        var timer = setTimeout(function () { return triggerAndBroadcast(label); }, ms);
                        activeTimers.push(timer);
                        scheduled++;
                        logger_1.logger.info("[scheduler] Queued: ".concat(label, " in ").concat(Math.round(ms / 60000), " min"));
                    };
                    for (_b = 0, _c = Array.from(triggerMinutes); _b < _c.length; _b++) {
                        minutes = _c[_b];
                        _loop_1(minutes);
                    }
                    // Also run immediately on startup to fix any drift
                    triggerAndBroadcast('startup sync');
                    logger_1.logger.info("[scheduler] ".concat(scheduled, " event(s) scheduled for today."));
                    msUntilMidnight = (_e = (_d = msUntilMinute(24 * 60)) !== null && _d !== void 0 ? _d : msUntilMinute(0)) !== null && _e !== void 0 ? _e : 86400000;
                    midnightTimer = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    logger_1.logger.info('[scheduler] Midnight reached, rescheduling for new day...');
                                    return [4 /*yield*/, scheduleToday()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }, msUntilMidnight);
                    activeTimers.push(midnightTimer);
                    return [2 /*return*/];
            }
        });
    });
}
