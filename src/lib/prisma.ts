import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
// Validate all required env vars on first import (throws if missing)
import './env';

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
const prismaClientSingleton = () => {
  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({
    connectionString,
    max: 20,              // Connection pool size: maximum 20 connections
    idleTimeoutMillis: 10000, // Close idle connections after 10 seconds to free up DB resources
    connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
  });
  const adapter = new PrismaPg(pool);
  const base = new PrismaClient({ adapter });
  return base;
};

export type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// Memaksa reload Prisma Client (menghapus cache dari memori dev server)
delete (globalForPrisma as any).prisma;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
