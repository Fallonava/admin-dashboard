import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import BroadcastQueue from "@/models/BroadcastQueue";
import { createClient } from "redis";

// Helper for sending redis trigger
async function triggerWaBot() {
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) return;
  
  try {
    const client = createClient({ url: REDIS_URL });
    await client.connect();
    // Publish raw trigger for the external worker bot
    await client.publish("wa:trigger_queue", "new_messages_added");
    await client.disconnect();
  } catch (error) {
    console.error("Redis trigger error for WA bot:", error);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const status = searchParams.get("status");

    await connectToDatabase();
    
    let query = {};
    if (status) {
      query = { status };
    }

    const queue = await BroadcastQueue.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: queue });
  } catch (error: any) {
    console.error("Error fetching broadcast queue:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload || !Array.isArray(payload.messages) || payload.messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payload: array of messages required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Batch insert into BroadcastQueue collection
    const inserted = await BroadcastQueue.insertMany(payload.messages);

    // Notify the standalone WA Bot that new queues are available
    await triggerWaBot();

    return NextResponse.json({ success: true, count: inserted.length, data: inserted });
  } catch (error: any) {
    console.error("Error inserting to broadcast queue:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "pending" | "sent" | "failed" | "all"

    await connectToDatabase();

    let filter = {};
    if (type && type !== "all") {
        filter = { status: type.toUpperCase() };
    }

    const result = await BroadcastQueue.deleteMany(filter);

    return NextResponse.json({ 
        success: true, 
        message: `Berhasil menghapus ${result.deletedCount} pesan.`,
        deletedCount: result.deletedCount 
    });
  } catch (error: any) {
    console.error("Error deleting broadcast queue:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
