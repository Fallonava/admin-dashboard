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
const addSoftDelete = (client: PrismaClient) =>
  client.$extends({
    query: {
      doctor: {
        findMany:          ({ args, query }) => query({ ...args, where: { deletedAt: null, ...args.where } }),
        findFirst:         ({ args, query }) => query({ ...args, where: { deletedAt: null, ...args.where } }),
        findFirstOrThrow:  ({ args, query }) => query({ ...args, where: { deletedAt: null, ...args.where } }),
        count:             ({ args, query }) => query({ ...args, where: { deletedAt: null, ...args.where } }),
        async delete({ args }) {
          const updatedDoctor = await client.doctor.update({ ...args, data: { deletedAt: new Date() } });
          if (updatedDoctor && updatedDoctor.id) {
            await client.shift.updateMany({
              where: { doctorId: updatedDoctor.id },
              data: { deletedAt: new Date() }
            });
            // Update leaves if any, though prisma doesn't track deletedAt for leaves yet, so perhaps physically delete or ignore. The schema doesn't have deletedAt on LeaveRequest.
            // Oh wait, LeaveRequest has onDelete: Cascade, so normally it deletes. Since we soft delete, to keep data integrity we shouldn't touch LeaveRequest if it doesn't have deletedAt, OR we hard delete it. The user only asked for "jadwal" (shifts).
          }
          return updatedDoctor;
        },
        async deleteMany({ args }) {
          const doctorsToDelete = await client.doctor.findMany({ where: args.where, select: { id: true } });
          const doctorIds = doctorsToDelete.map(d => d.id);
          if (doctorIds.length > 0) {
            await client.shift.updateMany({
              where: { doctorId: { in: doctorIds } },
              data: { deletedAt: new Date() }
            });
          }
          return client.doctor.updateMany({ ...args, data: { deletedAt: new Date() } });
        },
      },
      shift: {
        findMany:          ({ args, query }) => query({ ...args, where: { deletedAt: null, ...args.where } }),
        findFirst:         ({ args, query }) => query({ ...args, where: { deletedAt: null, ...args.where } }),
        findFirstOrThrow:  ({ args, query }) => query({ ...args, where: { deletedAt: null, ...args.where } }),
        count:             ({ args, query }) => query({ ...args, where: { deletedAt: null, ...args.where } }),
        async delete({ args }) {
          return client.shift.update({ ...args, data: { deletedAt: new Date() } });
        },
        async deleteMany({ args }) {
          return client.shift.updateMany({ ...args, data: { deletedAt: new Date() } });
        },
      },
      user: {
        findMany:          ({ args, query }) => query({ ...args, where: { deletedAt: null, ...args.where } }),
        findFirst:         ({ args, query }) => query({ ...args, where: { deletedAt: null, ...args.where } }),
        findFirstOrThrow:  ({ args, query }) => query({ ...args, where: { deletedAt: null, ...args.where } }),
        count:             ({ args, query }) => query({ ...args, where: { deletedAt: null, ...args.where } }),
        async delete({ args }) {
          return client.user.update({ ...args, data: { deletedAt: new Date() } });
        },
        async deleteMany({ args }) {
          return client.user.updateMany({ ...args, data: { deletedAt: new Date() } });
        },
      },
    },
  });

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
  return addSoftDelete(base);
};

export type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
