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
var data_fetchers_1 = require("./data-fetchers");
// NOTE: revalidatePath is loaded dynamically because this module runs
// inside the custom server.ts context where next/cache is unavailable.
var logger_1 = require("./logger");
var schedule_utils_1 = require("./schedule-utils");
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
        return 'LIBUR';
    // 3. Time-based State Calculation
    var isWithinAnyShift = false;
    var isAfterAllShifts = true;
    var activeShiftStatusOverride = null;
    var latestEndMinutes = 0;
    var hasCompletedAnyShift = false;
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
        else {
            // Shift is completely in the past
            hasCompletedAnyShift = true;
        }
    }
    // Sweep check: If the day is completely over, force SELESAI (respects cooldown)
    if (isAfterAllShifts && latestEndMinutes > 0) {
        if (isCooldownActive)
            return doc.status;
        return 'SELESAI';
    }
    // Inside Shift -> PRAKTEK (or override)
    if (isWithinAnyShift) {
        if (isCooldownActive)
            return doc.status;
        return activeShiftStatusOverride || 'PRAKTEK';
    }
    // Checks Registration Window for Upcoming Shifts
    // Default lookahead if no registrationTime is provided: 30 minutes
    var DEFAULT_LOOKAHEAD_MINS = 30;
    for (var _b = 0, todayShifts_2 = todayShifts; _b < todayShifts_2.length; _b++) {
        var shift = todayShifts_2[_b];
        if (!shift.formattedTime)
            continue;
        var _c = shift.formattedTime.split('-'), startStr = _c[0], endStr = _c[1];
        var startMinutes = parseTimeToMinutes(startStr);
        var endMinutes = parseTimeToMinutes(endStr);
        if (startMinutes === null || endMinutes === null)
            continue;
        if (currentTimeMinutes >= endMinutes)
            continue;
        var registrationStart = startMinutes - DEFAULT_LOOKAHEAD_MINS;
        var rTime = shift.registrationTime || doc.registrationTime;
        if (rTime) {
            var regMin = parseTimeToMinutes(rTime);
            if (regMin !== null)
                registrationStart = regMin;
        }
        // Inside registration window (before shift starts)
        if (currentTimeMinutes >= registrationStart && currentTimeMinutes < startMinutes) {
            if (isCooldownActive)
                return doc.status;
            var override = shift.statusOverride;
            return (override === 'PENUH' || override === 'OPERASI') ? override : 'PENDAFTARAN';
        }
    }
    // Find the next upcoming shift to propagate its override early if admin wants to lock it down early
    var nextShift = null;
    var nextStartMinutes = Infinity;
    for (var _d = 0, todayShifts_3 = todayShifts; _d < todayShifts_3.length; _d++) {
        var shift = todayShifts_3[_d];
        if (!shift.formattedTime)
            continue;
        var startStr = shift.formattedTime.split('-')[0];
        var startMinutes = parseTimeToMinutes(startStr);
        if (startMinutes !== null && startMinutes > currentTimeMinutes && startMinutes < nextStartMinutes) {
            nextStartMinutes = startMinutes;
            nextShift = shift;
        }
    }
    // Between shifts or before any registration begins
    if (isCooldownActive)
        return doc.status;
    if (nextShift && (nextShift.statusOverride === 'PENUH' || nextShift.statusOverride === 'OPERASI')) {
        return nextShift.statusOverride;
    }
    // If they have already completed a shift today, they should be marked as SELESAI during the break, not TERJADWAL
    if (hasCompletedAnyShift) {
        return 'SELESAI';
    }
    return 'TERJADWAL';
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
        var runStartTime, applied, failed, error, now, wibTime_1, currentDayIdx_1, currentHour, currentMinute, currentTimeMinutes, todayStr_1, rawDoctors_1, doctors, rawShifts, shifts, recentDateLimit, rawLeaves, leaves, settingsRow, settings, updates, automationEnabled, OVERRIDE_COOLDOWN_MS, rules, _a, ruleUpdates, _loop_2, _i, doctors_2, doc, concurrency, i, chunk, promises, results, revalidatePath, _b, err_1, errMsg, duration, _c;
        var _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    runStartTime = Date.now();
                    applied = 0, failed = 0;
                    error = null;
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 19, 20, 25]);
                    now = new Date();
                    wibTime_1 = new Date(now.getTime() + (7 * 60 * 60 * 1000));
                    currentDayIdx_1 = wibTime_1.getUTCDay() === 0 ? 6 : wibTime_1.getUTCDay() - 1;
                    currentHour = wibTime_1.getUTCHours();
                    currentMinute = wibTime_1.getUTCMinutes();
                    currentTimeMinutes = currentHour * 60 + currentMinute;
                    todayStr_1 = "".concat(wibTime_1.getUTCFullYear(), "-").concat(String(wibTime_1.getUTCMonth() + 1).padStart(2, '0'), "-").concat(String(wibTime_1.getUTCDate()).padStart(2, '0'));
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
                    recentDateLimit = new Date(wibTime_1.getTime() - (24 * 60 * 60 * 1000));
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
                    if (!!settingsRow) return [3 /*break*/, 7];
                    return [4 /*yield*/, prisma_1.prisma.settings.create({
                            data: {
                                id: "1",
                                automationEnabled: true,
                                runTextMessage: "Selamat Datang di RSU Siaga Medika",
                                emergencyMode: false,
                                customMessages: []
                            }
                        })];
                case 6:
                    // Auto seed default settings jika belum ada
                    settingsRow = _g.sent();
                    logger_1.logger.info('[automation] Auto-seeded default Settings row with automationEnabled=true');
                    _g.label = 7;
                case 7:
                    settings = settingsRow ? __assign(__assign({}, settingsRow), { id: String(settingsRow.id), runTextMessage: (_d = settingsRow.runTextMessage) !== null && _d !== void 0 ? _d : undefined, emergencyMode: (_e = settingsRow.emergencyMode) !== null && _e !== void 0 ? _e : undefined, customMessages: (_f = settingsRow.customMessages) !== null && _f !== void 0 ? _f : undefined }) : null;
                    updates = [];
                    automationEnabled = (settings === null || settings === void 0 ? void 0 : settings.automationEnabled) || false;
                    if (doctors.length === 0) {
                        logger_1.logger.warn('[automation] No doctors found, skipping automation run.');
                        return [2 /*return*/, { applied: 0, failed: 0 }];
                    }
                    if (!automationEnabled) {
                        // Even when automation is disabled, broadcast current DB state to admins
                        // so the dashboard always populates on load
                        logger_1.logger.info('[automation] Automation disabled. Broadcasting current state only.');
                        (0, data_fetchers_1.getFullSnapshot)().then(function (snapshot) {
                            (0, automation_broadcaster_1.syncAdminData)(snapshot);
                        }).catch(function (err) {
                            logger_1.logger.error('[automation] Startup broadcast failed:', err.message);
                        });
                        return [2 /*return*/, { applied: 0, failed: 0 }];
                    }
                    OVERRIDE_COOLDOWN_MS = 4 * 60 * 60 * 1000;
                    if (!prisma_1.prisma.automationRule) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma_1.prisma.automationRule.findMany({ where: { active: true } })];
                case 8:
                    _a = _g.sent();
                    return [3 /*break*/, 10];
                case 9:
                    _a = [];
                    _g.label = 10;
                case 10:
                    rules = _a;
                    if (rules.length > 0)
                        logger_1.logger.debug('[automation] loaded', rules.length, 'active rules');
                    ruleUpdates = evaluateRules(rules, doctors, shifts, leaves, now);
                    _loop_2 = function (doc) {
                        var isCooldownActive = false; // [REVISI] Penalti otomatisasi dimatikan atas perintah user agar 100% full otomatis
                        var todayShifts = shifts.filter(function (s) {
                            return s.doctorId === doc.id && s.dayIdx === currentDayIdx_1 && s.formattedTime &&
                                !(s.disabledDates || []).includes(todayStr_1) &&
                                (0, schedule_utils_1.isShiftActiveForDate)(s.extra, wibTime_1);
                        });
                        // 1. Check if there's a custom rule for this doctor
                        var ruleUpdate = ruleUpdates.find(function (u) { return String(u.id) === String(doc.id); });
                        // 2. Use Deterministic State Machine
                        var idealStatus = determineIdealStatus(doc, todayShifts, leaves, currentTimeMinutes, todayStr_1, isCooldownActive);
                        // 3. Resolve final target status (Rules override Time-based, but Manual Cooldown overrides ALL)
                        var targetStatus = doc.status;
                        if (ruleUpdate) {
                            // Custom rule takes precedence over normal schedule
                            targetStatus = ruleUpdate.status;
                        }
                        else if (doc.status !== idealStatus) {
                            // Otherwise fallback to schedule machine
                            targetStatus = idealStatus;
                        }
                        // Apply ideal status
                        if (doc.status !== targetStatus) {
                            logger_1.logger.info("[automation DEBUG] ".concat(doc.name, " (id ").concat(doc.id, ") state changed: ").concat(doc.status, " -> ").concat(targetStatus));
                            updates.push({ id: doc.id, status: targetStatus });
                        }
                    };
                    // Deterministic State Evaluation combined with rules
                    for (_i = 0, doctors_2 = doctors; _i < doctors_2.length; _i++) {
                        doc = doctors_2[_i];
                        _loop_2(doc);
                    }
                    if (!(updates.length > 0)) return [3 /*break*/, 14];
                    concurrency = 5;
                    i = 0;
                    _g.label = 11;
                case 11:
                    if (!(i < updates.length)) return [3 /*break*/, 14];
                    chunk = updates.slice(i, i + concurrency);
                    promises = chunk.map(function (u) {
                        return prisma_1.prisma.doctor.update({ where: { id: String(u.id) }, data: { status: u.status } });
                    });
                    return [4 /*yield*/, Promise.allSettled(promises)];
                case 12:
                    results = _g.sent();
                    results.forEach(function (r) { return r.status === 'fulfilled' ? applied++ : failed++; });
                    _g.label = 13;
                case 13:
                    i += concurrency;
                    return [3 /*break*/, 11];
                case 14:
                    if (!(applied > 0)) return [3 /*break*/, 18];
                    // notify any listeners about which doctors changed (SSE/Specific)
                    (0, automation_broadcaster_1.notifyDoctorUpdates)(updates.map(function (u) { return ({ id: u.id }); }));
                    // High Performance: Fetch updated state and push to all ADMINS via Socket.io
                    (0, data_fetchers_1.getFullSnapshot)().then(function (snapshot) {
                        (0, automation_broadcaster_1.syncAdminData)(snapshot);
                    }).catch(function (syncErr) {
                        logger_1.logger.error('[automation] Sync snapshot failed:', syncErr.message);
                    });
                    _g.label = 15;
                case 15:
                    _g.trys.push([15, 17, , 18]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('next/cache')); })];
                case 16:
                    revalidatePath = (_g.sent()).revalidatePath;
                    revalidatePath('/api/display');
                    return [3 /*break*/, 18];
                case 17:
                    _b = _g.sent();
                    return [3 /*break*/, 18];
                case 18: return [3 /*break*/, 25];
                case 19:
                    err_1 = _g.sent();
                    errMsg = err_1 instanceof Error ? err_1.stack || err_1.message : String(err_1);
                    logger_1.logger.error("[automation] run failed: ".concat(errMsg));
                    error = errMsg;
                    return [3 /*break*/, 25];
                case 20:
                    duration = Date.now() - runStartTime;
                    if (!prisma_1.prisma.automationLog) return [3 /*break*/, 24];
                    _g.label = 21;
                case 21:
                    _g.trys.push([21, 23, , 24]);
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
                case 22:
                    _g.sent();
                    return [3 /*break*/, 24];
                case 23:
                    _c = _g.sent();
                    return [3 /*break*/, 24];
                case 24: return [7 /*endfinally*/];
                case 25: return [2 /*return*/, { applied: applied, failed: failed }];
            }
        });
    });
}
