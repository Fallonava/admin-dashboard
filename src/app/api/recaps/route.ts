import { NextResponse } from 'next/server';
import { RecapService } from '@/features/recaps/services/RecapService';

export async function GET() {
  try {
    const recaps = await RecapService.getRecaps();
    return NextResponse.json({ success: true, data: recaps });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const savedRecap = await RecapService.saveRecap(payload);
    return NextResponse.json({ success: true, data: savedRecap });
  } catch (error: any) {
    console.error('Error saving recap:', error);
    const status = error.message.includes('Invalid payload') ? 400 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    if (!date) return NextResponse.json({ success: false, error: 'Parameter date diperlukan.' }, { status: 400 });

    await RecapService.deleteRecap(date);
    return NextResponse.json({ success: true, message: `Rekap tanggal ${date} berhasil dihapus.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
