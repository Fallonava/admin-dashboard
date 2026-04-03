import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(process.cwd(), 'backups', '2026-04-02T13-13-59');

async function restoreTable(tableName: string, model: any, options: { transform?: (data: any) => any } = {}) {
  const filePath = path.join(BACKUP_DIR, `${tableName}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`[SKIPPING] ${tableName} (file not found)`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`[RESTORING] ${tableName} (${data.length} records)...`);

  // Delete current data
  await model.deleteMany({});

  // Insert in chunks or all at once if safe
  for (const item of data) {
    const transformed = options.transform ? options.transform(item) : item;
    await model.create({ data: transformed });
  }
}

async function main() {
  try {
    console.log('--- STARTING DATABASE RESTORATION ---');

    // 1. Roles
    await restoreTable('Role', prisma.role);

    // 2. RolePermissions
    await restoreTable('RolePermission', prisma.rolePermission);

    // 3. Users
    await restoreTable('User', prisma.user, {
      transform: (item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        lastLogin: item.lastLogin ? new Date(item.lastLogin) : null,
      })
    });

    // 4. Doctors
    await restoreTable('Doctor', prisma.doctor);

    // 5. Shifts
    await restoreTable('Shift', prisma.shift);

    // 6. LeaveRequests
    await restoreTable('LeaveRequest', prisma.leaveRequest, {
      transform: (item) => ({
        ...item,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
      })
    });

    // 7. Settings
    await restoreTable('Settings', prisma.settings);

    // 8. BroadcastRules
    await restoreTable('BroadcastRule', prisma.broadcastRule);

    // 9. AutomationRules
    await restoreTable('AutomationRule', prisma.automationRule, {
      transform: (item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })
    });

    // 10. AutomationLogs
    await restoreTable('AutomationLog', prisma.automationLog, {
      transform: (item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      })
    });

    // 11. AuditLogs
    await restoreTable('AuditLog', prisma.auditLog, {
      transform: (item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      })
    });

    // 12. RefreshTokens
    await restoreTable('RefreshToken', prisma.refreshToken, {
      transform: (item) => ({
        ...item,
        expiresAt: new Date(item.expiresAt),
        createdAt: new Date(item.createdAt),
        revokedAt: item.revokedAt ? new Date(item.revokedAt) : null,
      })
    });

    console.log('--- RESTORATION COMPLETE ---');
  } catch (error) {
    console.error('--- RESTORATION FAILED ---');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
