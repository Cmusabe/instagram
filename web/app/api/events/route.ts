import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { trackEvent } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json();
    if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "";

    await trackEvent(type, data || {}, ip, ua);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Event tracking error:", e);
    return NextResponse.json({ ok: true }); // Never fail user-facing
  }
}
