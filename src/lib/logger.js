"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var winston_1 = __importDefault(require("winston"));
var _a = winston_1.default.format, combine = _a.combine, timestamp = _a.timestamp, printf = _a.printf, colorize = _a.colorize, errors = _a.errors;
// Format log sederhana untuk Console:
// [2026-03-10 12:00:00] INFO: System ready
var logFormat = printf(function (_a) {
    var level = _a.level, message = _a.message, timestamp = _a.timestamp, stack = _a.stack;
    return "[".concat(timestamp, "] ").concat(level, ": ").concat(stack || message);
});
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), // Untuk stack trace pada object Error
    logFormat),
    transports: [
        // Selalu cetak ke Console
        new winston_1.default.transports.Console({
            format: combine(colorize(), // Warna ANSI (merah untuk error, kuning untuk warn, dll)
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
        }),
        // Cetak juga ke file jika tidak ada sistem external (Loki/Logstash)
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});
// Jika LOKI_HOST telah dikonfigurasi, kita dapat menset transport Loki disini nanti.
// (Membantu menyiapkan log aggregation grafana)
if (process.env.LOKI_HOST) {
    exports.logger.info("Loki transport is enabled, sending logs to ".concat(process.env.LOKI_HOST));
    // require('winston-loki') implementation
}
