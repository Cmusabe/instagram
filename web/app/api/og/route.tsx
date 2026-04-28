import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Annuleer al je Instagram follow requests";
  const stat = searchParams.get("stat") || "127K+ requests geannuleerd";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#07070D",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(217,70,239,0.15), transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${new URL(req.url).origin}/logo/instaclean-logo.png`}
          alt=""
          width={180}
          height={60}
          style={{ marginBottom: "40px", objectFit: "contain" }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: "52px",
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: "900px",
            color: "rgba(255,255,255,0.92)",
            marginBottom: "30px",
          }}
        >
          {title}
        </div>

        {/* Stat */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "18px",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10B981",
            }}
          />
          {stat}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          <span>100% Gratis</span>
          <span>·</span>
          <span>Geen wachtwoord nodig</span>
          <span>·</span>
          <span>Lokaal in je browser</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
