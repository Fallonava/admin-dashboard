import { prisma } from '@/lib/prisma';
import { hashPassword, getSession } from '@/lib/auth';
import { logAuditAction } from '@/lib/audit';

export class UserService {
  static async getAllUsers() {
    const users = await prisma.user.findMany({
      include: { role: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    // Strip password
    return users.map(({ password, ...rest }) => rest);
  }

  static async createUser(data: any, req: Request) {
    const { username, password, name, roleId } = data;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new Error('Username sudah digunakan');
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, password: hashed, name, roleId: roleId || null },
      include: { role: { select: { id: true, name: true } } },
    });

    const session = await getSession(req);
    await logAuditAction({
      userId: session?.userId,
      action: 'CREATE_USER',
      resource: 'users',
      details: { createdUserId: user.id, username: user.username },
      req,
    });

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  static async updateUser(data: any, req: Request) {
    const { id, password, ...rest } = data;

    const updateData: Record<string, unknown> = { ...rest };
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: { select: { id: true, name: true } } },
    });

    const session = await getSession(req);
    await logAuditAction({
      userId: session?.userId,
      action: 'UPDATE_USER',
      resource: 'users',
      details: { updatedUserId: user.id, username: user.username, fields: Object.keys(rest) },
      req,
    });

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  static async deleteUser(id: string, req: Request) {
    const deletedUser = await prisma.user.delete({ where: { id } });
    
    const session = await getSession(req);
    await logAuditAction({
      userId: session?.userId,
      action: 'DELETE_USER',
      resource: 'users',
      details: { deletedUserId: deletedUser.id, username: deletedUser.username },
      req,
    });

    return true;
  }
}
