import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const status = searchParams.get("status") as any;

    const queue = await prisma.broadcastQueue.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: queue });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload || !Array.isArray(payload.messages) || payload.messages.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid payload: array of messages required" }, { status: 400 });
    }

    const inserted = await prisma.broadcastQueue.createMany({
      data: payload.messages.map((m: any) => ({
        patientName: m.patientName,
        whatsappNumber: m.whatsappNumber,
        doctorName: m.doctorName,
        clinicName: m.clinicName,
        messageText: m.messageText,
        log: m.log,
        sendAt: m.sendAt ? new Date(m.sendAt) : new Date(),
        status: "PENDING",
      })),
    });

    // NOTE: Bot WA sekarang menggunakan polling berkala ke PostgreSQL, 
    // jadi kita tidak mengirimkan trigger via Redis lagi.
    
    return NextResponse.json({ success: true, count: inserted.count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const result = await prisma.broadcastQueue.deleteMany({
      where: type && type !== "all" ? { status: type.toUpperCase() as any } : undefined,
    });

    return NextResponse.json({ success: true, message: `Berhasil menghapus ${result.count} pesan.`, deletedCount: result.count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
