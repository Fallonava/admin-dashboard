import { NextResponse } from 'next/server';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';
import { z } from 'zod';
import { UserCreateSchema, UserUpdateSchema } from '@/features/auth/types';
import { UserService } from '@/features/auth/services/UserService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authErr = await requirePermission(req, 'users', 'read');
  if (authErr) return authErr;

  const users = await UserService.getAllUsers();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const rateLimitErr = await withMutationRateLimit(req, 'users');
  if (rateLimitErr) return rateLimitErr;

  const authErr = await requirePermission(req, 'users', 'write');
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const validated = UserCreateSchema.parse(body);

    const safeUser = await UserService.createUser(validated, req);
    return NextResponse.json(safeUser, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.flatten() }, { status: 400 });
    }
    if (err.message === 'Username sudah digunakan') {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error('[Users POST]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const rateLimitErr = await withMutationRateLimit(req, 'users');
  if (rateLimitErr) return rateLimitErr;

  const authErr = await requirePermission(req, 'users', 'write');
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const validated = UserUpdateSchema.parse(body);

    const safeUser = await UserService.updateUser(validated, req);
    return NextResponse.json(safeUser);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.flatten() }, { status: 400 });
    }
    console.error('[Users PUT]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const rateLimitErr = await withMutationRateLimit(req, 'users');
  if (rateLimitErr) return rateLimitErr;

  const authErr = await requirePermission(req, 'users', 'write');
  if (authErr) return authErr;

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 });
    }

    await UserService.deleteUser(id, req);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Users DELETE]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
