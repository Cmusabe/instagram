import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addSubscriber } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "valid email required" }, { status: 400 });
    }

    await addSubscriber(email, source || "coming_soon");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Subscriber error:", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
