"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
/**
 * Type-safe environment variable validation using Zod.
 * Imported ONCE in `src/lib/prisma.ts` and key server entry points.
 * Throws a clear error at startup if any required variable is missing.
 */
var zod_1 = require("zod");
var serverSchema = zod_1.z.object({
    // ── Database ──
    DATABASE_URL: zod_1.z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
    // ── Auth ──
    JWT_SECRET: zod_1.z
        .string()
        .min(32, 'JWT_SECRET must be at least 32 characters long'),
    ADMIN_KEY: zod_1.z
        .string()
        .min(8, 'ADMIN_KEY must be at least 8 characters long'),
    // ── Misc ──
    NODE_ENV: zod_1.z
        .enum(['development', 'production', 'test'])
        .default('development'),
    CRON_SECRET: zod_1.z.string().optional(),
    NEXT_PUBLIC_APP_URL: zod_1.z.preprocess(function (v) { return (v === '' || v === undefined ? undefined : v); }, zod_1.z.string().url().optional()),
    SENTRY_DSN: zod_1.z.preprocess(function (v) { return (v === '' || v === undefined ? undefined : v); }, zod_1.z.string().url().optional()),
});
// Public env (accessible in browser) — must be prefixed NEXT_PUBLIC_
var clientSchema = zod_1.z.object({
    NEXT_PUBLIC_APP_URL: zod_1.z.string().url().optional(),
    NEXT_PUBLIC_ADMIN_KEY: zod_1.z.string().optional(),
});
function validateEnv() {
    // In the browser (client bundle) only validate client-side vars
    if (typeof window !== 'undefined') {
        var parsed_1 = clientSchema.safeParse({
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
            NEXT_PUBLIC_ADMIN_KEY: process.env.NEXT_PUBLIC_ADMIN_KEY,
        });
        if (!parsed_1.success) {
            console.error('❌ Invalid client environment variables:', parsed_1.error.flatten().fieldErrors);
        }
        return {};
    }
    var parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
        var errors = parsed.error.flatten().fieldErrors;
        var formatted = Object.entries(errors)
            .map(function (_a) {
            var key = _a[0], msgs = _a[1];
            return "  \u2022 ".concat(key, ": ").concat((msgs !== null && msgs !== void 0 ? msgs : []).join(', '));
        })
            .join('\n');
        var message = "\n\u274C Invalid/missing environment variables:\n".concat(formatted, "\n\nFix your .env file and restart the server.");
        if (process.env.SKIP_ENV_VALIDATION === 'true') {
            console.warn('⚠️ WARNING: Environment validation failed, but SKIP_ENV_VALIDATION is set. Proceeding with caution...');
            console.warn(message);
            return process.env;
        }
        throw new Error(message);
    }
    return parsed.data;
}
exports.env = validateEnv();
