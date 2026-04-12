"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.determineIdealStatus = determineIdealStatus;
exports.evaluateRules = evaluateRules;
exports.runAutomation = runAutomation;
var prisma_1 = require("./prisma");
var automation_broadcaster_1 = require("./automation-broadcaster");
var cache_1 = require("next/cache");
var logger_1 = require("./logger");
// Fungsi Utilitas Internal
/**
 * Mengonversi string waktu (misal: "09:00", "5 PM") menjadi total menit sejak tengah malam.
 * @param timeStr String waktu mentah.
 * @returns Total menit, atau null jika gagal parsing.
 */
function parseTimeToMinutes(timeStr) {
    if (!timeStr)
        return null;
    var t = timeStr.trim().toLowerCase();
    var ampm = t.match(/(am|pm)$/);
    var cleaned = t.replace(/\s*(am|pm)$/, '');
    cleaned = cleaned.replace('.', ':');
    var parts = cleaned.split(':');
    if (parts.length < 2)
        return null;
    var h = parseInt(parts[0]);
    var m = parseInt(parts[1]);
    if (isNaN(h) || isNaN(m))
        return null;
    if (ampm) {
        var ap = ampm[1];
        if (ap === 'pm' && h < 12)
            h += 12;
        if (ap === 'am' && h === 12)
            h = 0;
    }
    return h * 60 + m;
}
/**
 * Memformat objek Date menjadi string format YYYY-MM-DD.
 * @param date Objek Date.
 * @returns String tanggal format pendek.
 */
function formatDateYMD(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return "".concat(y, "-").concat(m, "-").concat(d);
}
/**
 * Mengecek apakah tanggal tertentu (hari ini) masuk dalam periode cuti.
 * Mengabaikan zona waktu dengan melakukan komparasi utuh pada tengah malam waktu lokal.
 * @param todayStr Tanggal dalam string format YYYY-MM-DD.
 * @param startDate Waktu mulai cuti.
 * @param endDate Waktu selesai cuti.
 * @returns True jika masuk rentang tanggal cuti.
 */
function isDateInLeavePeriod(todayStr, startDate, endDate) {
    if (!startDate || !endDate)
        return false;
    // Normalize todayStr (YYYY-MM-DD) into components
    var todayMatch = todayStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!todayMatch)
        return false;
    // To avoid timezone shift issues, parse strictly to midnight local time for comparison
    var target = new Date(Number(todayMatch[1]), Number(todayMatch[2]) - 1, Number(todayMatch[3]));
    target.setHours(0, 0, 0, 0);
    var start = new Date(startDate);
    var end = new Date(endDate);
    // We only care about YMD boundaries
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return target.getTime() >= start.getTime() && target.getTime() <= end.getTime();
}
function matchDoctorName(leaveName, doctorName) {
    var normalize = function (s) { return s.toLowerCase()
        .replace(/^dr\.?\s*/i, '')
        .replace(/,?\s*sp\.?\s*\w+/gi, '')
        .replace(/[^a-z0-9\s]/gi, '')
        .replace(/\s+/g, ' ')
        .trim(); };
    var a = normalize(leaveName);
    var b = normalize(doctorName);
    if (a === b)
        return true;
    return a.includes(b) || b.includes(a);
}
/**
 * Mesin Status Deterministik (Deterministic State Machine) untuk mengkalkulasi status ideal seorang dokter pada waktu saat ini.
 * Mempertimbangkan status cuti, jadwal shift, dan intervensi manual (cooldown).
 * @param doc Instansi data dokter dari database.
 * @param todayShifts Array jadwal dokter yang relevan hari ini.
 * @param leaves Array status cuti.
 * @param currentTimeMinutes Waktu server saat ini dalam menit dari tengah malam.
 * @param todayStr Tanggal hari ini formated YYYY-MM-DD.
 * @param isCooldownActive Menandai apakah sedang ada intervensi manual dalam 4 jam terakhir.
 * @returns Status deterministik final.
 */
function determineIdealStatus(doc, todayShifts, leaves, currentTimeMinutes, todayStr, isCooldownActive) {
    // 1. Cuti Check
    var isOnLeaveToday = leaves.some(function (leave) {
        return leave.doctorId === doc.id &&
            isDateInLeavePeriod(todayStr, leave.startDate, leave.endDate);
    });
    if (isOnLeaveToday)
        return 'CUTI';
    // 2. No Shifts Today Check
    if (todayShifts.length === 0)
        return 'TIDAK_PRAKTEK';
    // 3. Manual Override Check (respect admin changes during active shifts/breaks)
    if (isCooldownActive)
        return doc.status;
    // 4. Time-based State Calculation
    var isWithinAnyShift = false;
    var isAfterAllShifts = true;
    var activeShiftStatusOverride = null;
    var latestEndMinutes = 0;
    for (var _i = 0, todayShifts_1 = todayShifts; _i < todayShifts_1.length; _i++) {
        var shift = todayShifts_1[_i];
        if (!shift.formattedTime)
            continue;
        var _a = shift.formattedTime.split('-'), startStr = _a[0], endStr = _a[1];
        var startMinutes = parseTimeToMinutes(startStr);
        var endMinutes = parseTimeToMinutes(endStr);
        if (startMinutes === null || endMinutes === null)
            continue;
        if (endMinutes > latestEndMinutes)
            latestEndMinutes = endMinutes;
        if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
            isWithinAnyShift = true;
            if (shift.statusOverride)
                activeShiftStatusOverride = shift.statusOverride;
        }
        if (currentTimeMinutes < endMinutes) {
            isAfterAllShifts = false;
        }
    }
    // Inside Shift -> BUKA (or override)
    if (isWithinAnyShift) {
        return activeShiftStatusOverride || 'BUKA';
    }
    // End of Day Sweep -> SELESAI
    if (isAfterAllShifts && latestEndMinutes > 0) {
        return 'SELESAI';
    }
    // Before or Between Shifts -> AKAN_BUKA (or target shift override like OPERASI)
    var nextShift = todayShifts
        .filter(function (s) {
        var _a;
        var startStr = (_a = s.formattedTime) === null || _a === void 0 ? void 0 : _a.split('-')[0];
        var start = parseTimeToMinutes(startStr);
        return start !== null && start > currentTimeMinutes;
    })
        .sort(function (a, b) {
        var _a, _b;
        var startA = parseTimeToMinutes((_a = a.formattedTime) === null || _a === void 0 ? void 0 : _a.split('-')[0]) || 0;
        var startB = parseTimeToMinutes((_b = b.formattedTime) === null || _b === void 0 ? void 0 : _b.split('-')[0]) || 0;
        return startA - startB;
    })[0];
    var override = nextShift === null || nextShift === void 0 ? void 0 : nextShift.statusOverride;
    return (override === 'PENUH' || override === 'OPERASI') ? override : 'AKAN_BUKA';
}
/**
 * Mengevaluasi daftar aturan (rules) automasi terhadap ketersediaan data dokter & jadwal saat ini.
 * Mengembalikan list rekomendasi perubahan (tidak melalukan mutasi data). Fungsi ini aman (pure-like) dan bisa digunakan untuk disimulasikan.
 * @param rules Array objek aturan dari database.
 * @param doctors Daftar data semua dokter aktif.
 * @param shifts Penjadwalan shifts hari ini.
 * @param leaves Data permhonan cuti.
 * @param now Waktu eksekusi lokal (opsional).
 * @returns Array rekomendasi pembaruan.
 */
function evaluateRules(rules, doctors, shifts, leaves, now) {
    var updates = [];
    var ts = now || new Date();
    // Shift the date to WIB (UTC+7) so that our UTC methods get the actual Jakarta time
    var wibTime = new Date(ts.getTime() + (7 * 60 * 60 * 1000));
    var currentDayIdx = wibTime.getUTCDay() === 0 ? 6 : wibTime.getUTCDay() - 1;
    var currentHour = wibTime.getUTCHours();
    var currentMinute = wibTime.getUTCMinutes();
    var currentTimeMinutes = currentHour * 60 + currentMinute;
    var todayStr = "".concat(wibTime.getUTCFullYear(), "-").concat(String(wibTime.getUTCMonth() + 1).padStart(2, '0'), "-").concat(String(wibTime.getUTCDate()).padStart(2, '0'));
    for (var _i = 0, rules_1 = rules; _i < rules_1.length; _i++) {
        var rule = rules_1[_i];
        try {
            var cond = rule.condition || {};
            var act = rule.action || {};
            var _loop_1 = function (doc) {
                var match = true;
                if (cond.doctorName) {
                    if (!matchDoctorName(cond.doctorName, doc.name))
                        match = false;
                }
                if (cond.status && cond.status !== doc.status)
                    match = false;
                if (cond.dateRange) {
                    // Deprecated: dateRange as condition checking removed in automated leave implementation
                    // if (!isDateInRange(todayStr, cond.dateRange)) match = false;
                }
                if (cond.timeRange) {
                    var parts = String(cond.timeRange).split('-');
                    if (parts.length === 2) {
                        var s = parseTimeToMinutes(parts[0]);
                        var e = parseTimeToMinutes(parts[1]);
                        if (s === null || e === null)
                            match = false;
                        else if (!(currentTimeMinutes >= s && currentTimeMinutes < e))
                            match = false;
                    }
                }
                if (!match)
                    return "continue";
                if (act.status && doc.status !== act.status) {
                    if (!updates.some(function (u) { return String(u.id) === String(doc.id); })) {
                        updates.push({ id: doc.id, status: act.status });
                    }
                }
            };
            for (var _a = 0, doctors_1 = doctors; _a < doctors_1.length; _a++) {
                var doc = doctors_1[_a];
                _loop_1(doc);
            }
        }
        catch (e) {
            logger_1.logger.warn('rule evaluate error', (rule && rule.id) || '<unknown>', e);
        }
    }
    return updates;
}
/**
 * Mesin Induk Otomatisasi (Main Automation Engine).
 * Akan mengevaluasi jadwal harian, aturan khusus, cuti, dan secara langsung bermutasi ke database / queue.
 * @returns Feedback operasi (sukses terubah dan yang gagal).
 */
function runAutomation() {
    return __awaiter(this, void 0, void 0, function () {
        var runStartTime, applied, failed, error, now, wibTime, currentDayIdx_1, currentHour, currentMinute, currentTimeMinutes, todayStr_1, rawDoctors_1, doctors, rawShifts, shifts, recentDateLimit, rawLeaves, leaves, settingsRow, settings, updates, rules, _a, automationEnabled, OVERRIDE_COOLDOWN_MS, _loop_2, _i, doctors_2, doc, getAutomationQueue, queue, queueErr_1, isNoQueueError, appUrl, fallbackRes, fallbackErr_1, concurrency, i, chunk, promises, results, err_1, err_2, errMsg, duration, _b;
        var _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    runStartTime = Date.now();
                    applied = 0, failed = 0;
                    error = null;
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 27, 28, 33]);
                    now = new Date();
                    wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
                    currentDayIdx_1 = wibTime.getUTCDay() === 0 ? 6 : wibTime.getUTCDay() - 1;
                    currentHour = wibTime.getUTCHours();
                    currentMinute = wibTime.getUTCMinutes();
                    currentTimeMinutes = currentHour * 60 + currentMinute;
                    todayStr_1 = "".concat(wibTime.getUTCFullYear(), "-").concat(String(wibTime.getUTCMonth() + 1).padStart(2, '0'), "-").concat(String(wibTime.getUTCDate()).padStart(2, '0'));
                    return [4 /*yield*/, prisma_1.prisma.doctor.findMany()];
                case 2:
                    rawDoctors_1 = _g.sent();
                    doctors = rawDoctors_1.map(function (d) { return (__assign(__assign({}, d), { id: String(d.id), lastManualOverride: d.lastManualOverride !== null ? Number(d.lastManualOverride) : undefined })); });
                    return [4 /*yield*/, prisma_1.prisma.shift.findMany({
                            where: { dayIdx: currentDayIdx_1 }
                        })];
                case 3:
                    rawShifts = _g.sent();
                    shifts = rawShifts.map(function (s) {
                        var docRef = rawDoctors_1.find(function (d) { return d.id === s.doctorId; });
                        return __assign(__assign({}, s), { id: Number(s.id), doctor: (docRef === null || docRef === void 0 ? void 0 : docRef.name) || '' });
                    });
                    recentDateLimit = new Date(wibTime.getTime() - (24 * 60 * 60 * 1000));
                    return [4 /*yield*/, prisma_1.prisma.leaveRequest.findMany({
                            where: { endDate: { gte: recentDateLimit } }
                        })];
                case 4:
                    rawLeaves = _g.sent();
                    leaves = rawLeaves.map(function (l) {
                        var docRef = rawDoctors_1.find(function (d) { return d.id === l.doctorId; });
                        return __assign(__assign({}, l), { id: String(l.id), doctor: (docRef === null || docRef === void 0 ? void 0 : docRef.name) || '' });
                    });
                    return [4 /*yield*/, prisma_1.prisma.settings.findFirst()];
                case 5:
                    settingsRow = _g.sent();
                    settings = settingsRow ? __assign(__assign({}, settingsRow), { id: String(settingsRow.id), runTextMessage: (_c = settingsRow.runTextMessage) !== null && _c !== void 0 ? _c : undefined, emergencyMode: (_d = settingsRow.emergencyMode) !== null && _d !== void 0 ? _d : undefined, customMessages: (_e = settingsRow.customMessages) !== null && _e !== void 0 ? _e : undefined }) : null;
                    updates = [];
                    if (!prisma_1.prisma.automationRule) return [3 /*break*/, 7];
                    return [4 /*yield*/, prisma_1.prisma.automationRule.findMany({ where: { active: true } })];
                case 6:
                    _a = _g.sent();
                    return [3 /*break*/, 8];
                case 7:
                    _a = [];
                    _g.label = 8;
                case 8:
                    rules = _a;
                    if (rules.length > 0)
                        logger_1.logger.debug('[automation] loaded', rules.length, 'active rules');
                    updates.push.apply(updates, evaluateRules(rules, doctors, shifts, leaves, now));
                    automationEnabled = (settings === null || settings === void 0 ? void 0 : settings.automationEnabled) || false;
                    if (!automationEnabled || doctors.length === 0) {
                        return [2 /*return*/, { applied: 0, failed: 0 }];
                    }
                    OVERRIDE_COOLDOWN_MS = 4 * 60 * 60 * 1000;
                    _loop_2 = function (doc) {
                        var isCooldownActive = doc.lastManualOverride
                            ? (now.getTime() - doc.lastManualOverride) < OVERRIDE_COOLDOWN_MS
                            : false;
                        var todayShifts = shifts.filter(function (s) {
                            return s.doctorId === doc.id && s.dayIdx === currentDayIdx_1 && s.formattedTime &&
                                !(s.disabledDates || []).includes(todayStr_1);
                        });
                        // Using the pure Deterministic State Machine
                        var idealStatus = determineIdealStatus(doc, todayShifts, leaves, currentTimeMinutes, todayStr_1, isCooldownActive);
                        // Apply ideal status
                        if (doc.status !== idealStatus) {
                            // If it's a cooldown forcing doc.status to stay, idealStatus will be === doc.status, so it won't push update.
                            logger_1.logger.info("[automation DEBUG] ".concat(doc.name, " (id ").concat(doc.id, ") state changed: ").concat(doc.status, " -> ").concat(idealStatus));
                            updates.push({ id: doc.id, status: idealStatus });
                        }
                    };
                    // Deterministic State Evaluation
                    for (_i = 0, doctors_2 = doctors; _i < doctors_2.length; _i++) {
                        doc = doctors_2[_i];
                        _loop_2(doc);
                    }
                    _g.label = 9;
                case 9:
                    _g.trys.push([9, 25, , 26]);
                    if (!(updates.length > 0)) return [3 /*break*/, 24];
                    _g.label = 10;
                case 10:
                    _g.trys.push([10, 19, , 24]);
                    _g.label = 11;
                case 11:
                    _g.trys.push([11, 16, , 18]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./automation-queue')); })];
                case 12:
                    getAutomationQueue = (_g.sent()).getAutomationQueue;
                    queue = getAutomationQueue();
                    if (!queue.isReady()) return [3 /*break*/, 14];
                    return [4 /*yield*/, queue.addBatch(updates)];
                case 13:
                    _g.sent();
                    applied = updates.length;
                    logger_1.logger.debug('[automation] queued', updates.length, 'jobs');
                    return [3 /*break*/, 15];
                case 14: throw new Error('Queue not ready');
                case 15: return [3 /*break*/, 18];
                case 16:
                    queueErr_1 = _g.sent();
                    isNoQueueError = queueErr_1 instanceof Error && queueErr_1.message === 'Queue not ready';
                    if (!isNoQueueError) {
                        logger_1.logger.debug('[automation] queue unavailable, using bulk API:', queueErr_1 instanceof Error ? queueErr_1.message : String(queueErr_1));
                    }
                    appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
                    return [4 /*yield*/, fetch("".concat(appUrl, "/api/doctors?action=bulk"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(process.env.ADMIN_KEY)
                            },
                            body: JSON.stringify(updates)
                        })];
                case 17:
                    fallbackRes = _g.sent();
                    if (!fallbackRes.ok)
                        throw new Error("Bulk API failed: ".concat(fallbackRes.status));
                    applied = updates.length;
                    return [3 /*break*/, 18];
                case 18: return [3 /*break*/, 24];
                case 19:
                    fallbackErr_1 = _g.sent();
                    logger_1.logger.debug('[automation] bulk API failed, falling back to direct db update:', fallbackErr_1 instanceof Error ? fallbackErr_1.message : String(fallbackErr_1));
                    concurrency = 5;
                    i = 0;
                    _g.label = 20;
                case 20:
                    if (!(i < updates.length)) return [3 /*break*/, 23];
                    chunk = updates.slice(i, i + concurrency);
                    promises = chunk.map(function (u) {
                        return prisma_1.prisma.doctor.update({ where: { id: String(u.id) }, data: { status: u.status } });
                    });
                    return [4 /*yield*/, Promise.allSettled(promises)];
                case 21:
                    results = _g.sent();
                    results.forEach(function (r) { return r.status === 'fulfilled' ? applied++ : failed++; });
                    _g.label = 22;
                case 22:
                    i += concurrency;
                    return [3 /*break*/, 20];
                case 23: return [3 /*break*/, 24];
                case 24: return [3 /*break*/, 26];
                case 25:
                    err_1 = _g.sent();
                    error = (_f = err_1 === null || err_1 === void 0 ? void 0 : err_1.message) !== null && _f !== void 0 ? _f : String(err_1);
                    throw err_1;
                case 26:
                    if (applied > 0) {
                        // notify any listeners about which doctors changed
                        (0, automation_broadcaster_1.notifyDoctorUpdates)(updates.map(function (u) { return ({ id: u.id }); }));
                        try {
                            // Force Vercel to purge the static Edge Cache for the TV display
                            (0, cache_1.revalidatePath)('/api/display');
                        }
                        catch (cacheErr) {
                            logger_1.logger.error('[automation] Failed to revalidate display cache:', cacheErr);
                        }
                    }
                    return [3 /*break*/, 33];
                case 27:
                    err_2 = _g.sent();
                    errMsg = err_2 instanceof Error ? err_2.stack || err_2.message : String(err_2);
                    logger_1.logger.error("[automation] run failed: ".concat(errMsg));
                    error = errMsg;
                    return [3 /*break*/, 33];
                case 28:
                    duration = Date.now() - runStartTime;
                    if (!prisma_1.prisma.automationLog) return [3 /*break*/, 32];
                    _g.label = 29;
                case 29:
                    _g.trys.push([29, 31, , 32]);
                    return [4 /*yield*/, prisma_1.prisma.automationLog.create({
                            data: {
                                type: error ? 'error' : 'run',
                                details: {
                                    applied: applied,
                                    failed: failed,
                                    error: error,
                                    durationMs: duration,
                                    timestamp: new Date().toISOString()
                                }
                            }
                        }).catch(function (writeErr) {
                            logger_1.logger.error('failed writing automationLog', writeErr);
                        })];
                case 30:
                    _g.sent();
                    return [3 /*break*/, 32];
                case 31:
                    _b = _g.sent();
                    return [3 /*break*/, 32];
                case 32: return [7 /*endfinally*/];
                case 33: return [2 /*return*/, { applied: applied, failed: failed }];
            }
        });
    });
}
