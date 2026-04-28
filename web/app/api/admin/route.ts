import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getStats, getSubscribers } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authKey = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  const secret = process.env.ADMIN_SECRET;
  const fallback = "instaclean-admin-2026";

  // Accept either env secret or fallback
  if (authKey !== secret && authKey !== fallback) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stats = await getStats();
  const subscribers = await getSubscribers();

  return NextResponse.json({
    stats,
    subscribers,
    dbConnected: !!process.env.SUPABASE_SERVICE_KEY,
  });
}
