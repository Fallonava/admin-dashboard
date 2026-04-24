import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';
import { getSession } from '@/lib/auth';
import { invalidateRbacCache } from '@/lib/rbac-cache';

export class RoleService {
  static async getAllRoles() {
    return prisma.role.findMany({
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async createRole(data: any, req: Request) {
    const { name, description, permissions } = data;

    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      throw new Error('Nama role sudah digunakan');
    }

    const newRole = await prisma.role.create({
      data: {
        name,
        description: description || null,
        permissions: {
          create: (permissions || []).map((p: { resource: string; action: string }) => ({
            resource: p.resource,
            action: p.action,
          })),
        },
      },
      include: { permissions: true, _count: { select: { users: true } } },
    });

    const session = await getSession(req);
    await logAuditAction({
      userId: session?.userId,
      action: 'CREATE_ROLE',
      resource: 'roles',
      details: { roleId: newRole.id, roleName: newRole.name, permissionsCount: newRole.permissions.length },
      req,
    });

    return newRole;
  }

  static async updateRole(data: any, req: Request) {
    const { id, name, description, permissions } = data;

    const existing = await prisma.role.findUnique({ where: { id } });
    if (existing?.isSystem && name !== existing.name) {
      throw new Error('Nama role sistem tidak dapat diubah');
    }

    await prisma.rolePermission.deleteMany({ where: { roleId: id } });

    const updated = await prisma.role.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description ?? undefined,
        permissions: {
          create: (permissions || []).map((p: { resource: string; action: string }) => ({
            resource: p.resource,
            action: p.action,
          })),
        },
      },
      include: { permissions: true, _count: { select: { users: true } } },
    });

    const session = await getSession(req);
    await logAuditAction({
      userId: session?.userId,
      action: 'UPDATE_ROLE',
      resource: 'roles',
      details: { roleId: updated.id, roleName: updated.name, newPermissionsCount: updated.permissions.length },
      req,
    });

    const affectedUsers = await prisma.user.findMany({ where: { roleId: id }, select: { id: true } });
    await Promise.all(affectedUsers.map(u => invalidateRbacCache(u.id)));

    return updated;
  }

  static async deleteRole(id: string, req: Request) {
    const existing = await prisma.role.findUnique({ where: { id } });
    if (existing?.isSystem) {
      throw new Error('Role sistem tidak dapat dihapus');
    }

    const deletedRole = await prisma.role.delete({ where: { id } });
    
    const session = await getSession(req);
    await logAuditAction({
      userId: session?.userId,
      action: 'DELETE_ROLE',
      resource: 'roles',
      details: { roleId: deletedRole.id, roleName: deletedRole.name },
      req,
    });
    
    return true;
  }
}
