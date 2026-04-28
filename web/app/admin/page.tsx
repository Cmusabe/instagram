"use client";

import { useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { BarChart3, Users, Zap, Clock, RefreshCw, Database, AlertTriangle, Download, Lock } from "lucide-react";

interface Stats {
  totalEvents: number;
  todayEvents: number;
  eventsByType: { type: string; count: number }[];
  totalSubscribers: number;
  recentEvents: { type: string; data: Record<string, unknown>; created_at: string }[];
  dailyEvents: { date: string; count: number }[];
}

interface AdminData {
  stats: Stats;
  subscribers: { email: string; source: string; created_at: string }[];
  dbConnected: boolean;
  message?: string;
}

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (authKey: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin?key=${encodeURIComponent(authKey)}`);
      if (res.status === 401) {
        setError("Ongeldig wachtwoord");
        setAuthed(false);
        return;
      }
      const json = await res.json();
      setData(json);
      setAuthed(true);
    } catch {
      setError("Kon geen verbinding maken met de server");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(key);
  };

  const refresh = () => { if (key) fetchData(key); };

  const exportSubscribers = () => {
    if (!data?.subscribers.length) return;
    const csv = "email,source,date\n" + data.subscribers.map((s) => `${s.email},${s.source},${s.created_at}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "instaclean-subscribers.csv";
    a.click();
  };

  if (!authed) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-sm mx-auto px-6 pt-40">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(217,70,239,0.08)", color: "#D946EF" }}>
              <Lock size={22} />
            </div>
            <h1 className="text-xl font-bold">Admin Paneel</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Voer het admin wachtwoord in</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Admin wachtwoord"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)" }}
              autoFocus
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-xl py-3 text-sm font-semibold text-white cursor-pointer transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>
              {loading ? "Laden..." : "Inloggen"}
            </button>
          </form>
          <p className="text-[10px] text-center mt-4" style={{ color: "rgba(255,255,255,0.15)" }}>
            Standaard wachtwoord: instaclean-admin-2026
          </p>
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-[1100px] mx-auto px-6 pt-28 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>InstaClean Admin</p>
          </div>
          <button onClick={refresh} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-white/[0.03]" style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Ververs
          </button>
        </div>

        {/* DB status */}
        {!data?.dbConnected && (
          <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}>
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-400">Geen database verbonden</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {data?.message || "Voeg POSTGRES_URL toe aan Vercel environment variables voor persistente data."}
              </p>
            </div>
          </div>
        )}

        {data?.dbConnected && (
          <div className="rounded-xl p-3 mb-6 flex items-center gap-2" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}>
            <Database size={14} className="text-green" />
            <span className="text-xs text-green">Database verbonden</span>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Zap size={16} />, label: "Totaal events", value: stats?.totalEvents || 0, color: "#D946EF" },
            { icon: <Clock size={16} />, label: "Vandaag", value: stats?.todayEvents || 0, color: "#8B5CF6" },
            { icon: <Users size={16} />, label: "Subscribers", value: stats?.totalSubscribers || 0, color: "#06B6D4" },
            { icon: <BarChart3 size={16} />, label: "Event types", value: stats?.eventsByType?.length || 0, color: "#10B981" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: s.color }}>{s.icon}</span>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>{s.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Events by type */}
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h3 className="text-sm font-semibold mb-4">Events per type</h3>
            {stats?.eventsByType && stats.eventsByType.length > 0 ? (
              <div className="space-y-2">
                {stats.eventsByType.map((e) => (
                  <div key={e.type} className="flex items-center justify-between text-xs">
                    <span className="font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{e.type}</span>
                    <span className="font-bold tabular-nums">{Number(e.count).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Nog geen events geregistreerd</p>
            )}
          </div>

          {/* Subscribers */}
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Subscribers</h3>
              {data?.subscribers && data.subscribers.length > 0 && (
                <button onClick={exportSubscribers} className="flex items-center gap-1 text-[10px] cursor-pointer" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <Download size={10} />
                  CSV
                </button>
              )}
            </div>
            {data?.subscribers && data.subscribers.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {data.subscribers.map((s) => (
                  <div key={s.email} className="flex items-center justify-between text-xs">
                    <span className="font-mono truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{s.email}</span>
                    <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                      {new Date(s.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Nog geen subscribers</p>
            )}
          </div>

          {/* Recent events */}
          <div className="sm:col-span-2 rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h3 className="text-sm font-semibold mb-4">Recente events</h3>
            {stats?.recentEvents && stats.recentEvents.length > 0 ? (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {stats.recentEvents.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(217,70,239,0.08)", color: "#D946EF" }}>{e.type}</span>
                    <span className="flex-1 font-mono truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{JSON.stringify(e.data)}</span>
                    <span className="text-[10px] flex-shrink-0 tabular-nums" style={{ color: "rgba(255,255,255,0.15)" }}>
                      {new Date(e.created_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Nog geen events</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
