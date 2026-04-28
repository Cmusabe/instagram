import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { trackEvent } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Alle velden zijn verplicht" }, { status: 400 });
    }
    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
    }

    // Store in Supabase events table
    await trackEvent("contact_form", { name, email, subject, message });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Contact form error:", e);
    return NextResponse.json({ error: "Er ging iets mis. Probeer het opnieuw." }, { status: 500 });
  }
}
