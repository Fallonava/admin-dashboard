import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

const MIME_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(request: NextRequest) {
  const rateLimitErr = await withMutationRateLimit(request, 'upload');
  if (rateLimitErr) return rateLimitErr;

  const authErr = await requirePermission(request, 'settings', 'write');
  if (authErr) return authErr;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file ditemukan' }, { status: 400 });
    }

    // Validasi tipe file secara ketat
    const safeExt = MIME_MAP[file.type.toLowerCase()];
    if (!safeExt) {
      return NextResponse.json({ error: 'Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.' }, { status: 400 });
    }

    // Batasi ukuran 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Buat nama file unik aman dari serangan path traversal / double extension
    const randomHash = crypto.randomBytes(6).toString('hex');
    const timestamp = Date.now();
    const fileName = `hero-${timestamp}-${randomHash}.${safeExt}`;

    // Pastikan direktori ada
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'portal');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/portal/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      message: `Gambar berhasil diunggah` 
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Gagal mengunggah file.' }, { status: 500 });
  }
}
