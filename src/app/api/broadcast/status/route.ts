import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const stateFile = path.join(process.cwd(), '.wa-status.json');
const commandFile = path.join(process.cwd(), '.wa-command');

export async function GET() {
  try {
    if (!fs.existsSync(stateFile)) {
      return NextResponse.json({ success: true, data: { state: "DISCONNECTED", qr: null, timestamp: 0 } });
    }
    
    const stateStr = fs.readFileSync(stateFile, 'utf8');
    return NextResponse.json({ success: true, data: JSON.parse(stateStr) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === "LOGOUT") {
        fs.writeFileSync(commandFile, "LOGOUT\n", "utf8");
        return NextResponse.json({ success: true, message: "Instruksi logout telah dikirimkan ke worker." });
    }
    return NextResponse.json({ success: false, error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
