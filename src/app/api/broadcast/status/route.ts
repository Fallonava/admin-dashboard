import { NextResponse } from "next/server";
import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;
let redisPublisher: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", (err) => console.error("Redis Status API Error:", err));
    await redisClient.connect();
  }
  return redisClient;
}

async function getRedisPublisher() {
  if (!redisPublisher) {
    redisPublisher = createClient({ url: process.env.REDIS_URL });
    redisPublisher.on("error", (err) => console.error("Redis Publisher API Error:", err));
    await redisPublisher.connect();
  }
  return redisPublisher;
}

export async function GET() {
  try {
    const client = await getRedisClient();
    const stateStr = await client.get("wa:bot_state");
    
    if (!stateStr) {
      return NextResponse.json({ success: true, data: { state: "DISCONNECTED", qr: null, timestamp: 0 } });
    }

    return NextResponse.json({ success: true, data: JSON.parse(stateStr) });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === "LOGOUT") {
        const publisher = await getRedisPublisher();
        await publisher.publish("wa:command", "LOGOUT");
        return NextResponse.json({ success: true, message: "Instruksi logout telah dikirimkan ke worker." });
    }
    return NextResponse.json({ success: false, error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
