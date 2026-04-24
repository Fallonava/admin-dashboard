import { NextResponse } from 'next/server';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';
import { z } from 'zod';
import { RoleCreateSchema, RoleUpdateSchema } from '@/features/auth/types';
import { RoleService } from '@/features/auth/services/RoleService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authErr = await requirePermission(req, 'access', 'read');
  if (authErr) return authErr;

  const roles = await RoleService.getAllRoles();
  return NextResponse.json(roles);
}

export async function POST(req: Request) {
  const rateLimitErr = await withMutationRateLimit(req, 'roles');
  if (rateLimitErr) return rateLimitErr;

  const authErr = await requirePermission(req, 'access', 'write');
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const validated = RoleCreateSchema.parse(body);

    const newRole = await RoleService.createRole(validated, req);
    return NextResponse.json(newRole, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.flatten() }, { status: 400 });
    }
    if (err.message === 'Nama role sudah digunakan') {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error('[Roles POST]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const rateLimitErr = await withMutationRateLimit(req, 'roles');
  if (rateLimitErr) return rateLimitErr;

  const authErr = await requirePermission(req, 'access', 'write');
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const validated = RoleUpdateSchema.parse(body);

    const updated = await RoleService.updateRole(validated, req);
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.flatten() }, { status: 400 });
    }
    if (err.message === 'Nama role sistem tidak dapat diubah') {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error('[Roles PUT]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const rateLimitErr = await withMutationRateLimit(req, 'roles');
  if (rateLimitErr) return rateLimitErr;

  const authErr = await requirePermission(req, 'access', 'write');
  if (authErr) return authErr;

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Role ID wajib diisi' }, { status: 400 });
    }

    await RoleService.deleteRole(id, req);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === 'Role sistem tidak dapat dihapus') {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error('[Roles DELETE]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
