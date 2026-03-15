import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Format log sederhana untuk Console:
// [2026-03-10 12:00:00] INFO: System ready
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }), // Untuk stack trace pada object Error
        logFormat
    ),
    transports: [
        // Selalu cetak ke Console
        new winston.transports.Console({
            format: combine(
                colorize(), // Warna ANSI (merah untuk error, kuning untuk warn, dll)
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat
            ),
        }),
        // Cetak juga ke file jika tidak ada sistem external (Loki/Logstash)
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// Jika LOKI_HOST telah dikonfigurasi, kita dapat menset transport Loki disini nanti.
// (Membantu menyiapkan log aggregation grafana)
if (process.env.LOKI_HOST) {
    logger.info(`Loki transport is enabled, sending logs to ${process.env.LOKI_HOST}`);
    // require('winston-loki') implementation
}
