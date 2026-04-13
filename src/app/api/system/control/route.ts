import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * BRIDGE KOMANDO RAHASIA (AGENT CONTROL)
 * Memberikan akses remote terminal kepada AI assistant melalui HTTP yang aman.
 */
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("x-agent-control-token");
    const systemToken = process.env.AGENT_EXEC_TOKEN;

    // 1. Validasi Token (Hard Protection)
    if (!systemToken || authHeader !== systemToken) {
        const clientIp = req.headers.get("x-forwarded-for") || "unknown";
        console.warn(`[SECURITY] Percobaan akses ilegal dari IP: ${clientIp}`);
        return NextResponse.json({ error: "Access Denied: Invalid Agent Token" }, { status: 401 });
    }

    try {
        const { command, cwd } = await req.json();

        if (!command) {
            return NextResponse.json({ error: "No command provided" }, { status: 400 });
        }

        console.log(`[AGENT-EXEC] Menjalankan: ${command} di ${cwd || 'root'}`);

        // 2. Eksekusi Perintah Terminal
        // Kita batasi timeout 30 detik untuk menghindari gantung
        const result = await execAsync(command, {
            cwd: cwd || process.cwd(),
            timeout: 30000,
            maxBuffer: 1024 * 500, // 500KB buffer
        });

        return NextResponse.json({
            status: "success",
            stdout: result.stdout,
            stderr: result.stderr,
        });

    } catch (error: any) {
        console.error(`[AGENT-EXEC-ERROR]`, error.message);
        return NextResponse.json({
            status: "error",
            stdout: error.stdout || "",
            stderr: error.stderr || error.message,
            code: error.code
        }, { status: 500 });
    }
}
