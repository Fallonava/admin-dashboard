"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
var client_1 = require("@prisma/client");
var pg_1 = require("pg");
var adapter_pg_1 = require("@prisma/adapter-pg");
// Validate all required env vars on first import (throws if missing)
require("./env");
// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices
// ─── Soft-Delete Extension ───────────────────────────────────────────────────
// Intercepts read/delete queries on Doctor, Shift, and User:
//   - Reads: automatically appends `where: { deletedAt: null }`
//   - Deletes: convert hard-delete to soft-delete (set deletedAt = now())
//
// To bypass (e.g. admin restore): use `(prisma as any).$executeRawUnsafe(...)`
// or an explicit query without going through the extended client.
// ─────────────────────────────────────────────────────────────────────────────
var prismaClientSingleton = function () {
    var connectionString = "".concat(process.env.DATABASE_URL);
    var pool = new pg_1.Pool({
        connectionString: connectionString,
        max: 20, // Connection pool size: maximum 20 connections
        idleTimeoutMillis: 10000, // Close idle connections after 10 seconds to free up DB resources
        connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
    });
    var adapter = new adapter_pg_1.PrismaPg(pool);
    var base = new client_1.PrismaClient({ adapter: adapter });
    return base;
};
var globalForPrisma = globalThis;
// Memaksa reload Prisma Client (menghapus cache dari memori dev server)
delete globalForPrisma.prisma;
exports.prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : prismaClientSingleton();
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
