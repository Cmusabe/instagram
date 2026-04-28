import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-[8rem] sm:text-[12rem] font-extrabold leading-none tracking-tighter" style={{ color: "rgba(255,255,255,0.03)" }}>
          404
        </div>
        <h1 className="text-2xl font-bold -mt-8 mb-3">Pagina niet gevonden</h1>
        <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 400 }}>
          Deze pagina bestaat niet. Misschien was het een follow request die al geannuleerd is.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)", boxShadow: "0 0 16px rgba(217,70,239,0.2)" }}
        >
          Terug naar home
        </Link>
      </main>
    </div>
  );
}
