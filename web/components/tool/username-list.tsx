"use client";

import { useState, useMemo } from "react";
import { Users, Trash2, Search, X } from "lucide-react";

interface Props {
  usernames: string[];
  onClear: () => void;
}

export function UsernameList({ usernames, onClear }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const displayLimit = 24;

  const filtered = useMemo(() => {
    if (!search) return usernames;
    const q = search.toLowerCase();
    return usernames.filter((u) => u.toLowerCase().includes(q));
  }, [usernames, search]);

  const shown = showAll ? filtered : filtered.slice(0, displayLimit);
  const hasMore = filtered.length > displayLimit;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", animation: "fadeUp 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)", boxShadow: "0 0 16px rgba(217,70,239,0.25)" }}>
            {usernames.length > 999 ? `${(usernames.length / 1000).toFixed(1)}k` : usernames.length}
          </div>
          <div>
            <p className="text-sm font-semibold">{usernames.length.toLocaleString()} accounts</p>
            <p className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Users size={10} /> Klaar om te verwerken
            </p>
          </div>
        </div>
        <button onClick={onClear} className="flex items-center gap-1.5 text-xs cursor-pointer transition-all duration-300 hover:-translate-y-0.5 px-2 py-1 rounded-lg hover:bg-red-500/5" style={{ color: "rgba(255,255,255,0.25)" }}>
          <Trash2 size={12} />
          Wis
        </button>
      </div>

      {/* Search */}
      {usernames.length > 10 && (
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.2)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek username..."
              className="w-full pl-9 pr-8 py-2 rounded-lg text-xs font-mono outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "rgba(255,255,255,0.2)" }}>
                <X size={12} />
              </button>
            )}
          </div>
          {search && (
            <p className="text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
              {filtered.length} resultaten
            </p>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="max-h-52 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {shown.map((username) => (
            <div key={username} className="px-4 py-1.5 text-[11px] font-mono truncate transition-colors hover:bg-white/[0.015]" style={{ color: "rgba(255,255,255,0.35)", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
              @{username}
            </div>
          ))}
        </div>
      </div>

      {/* Show more */}
      {hasMore && !showAll && (
        <button onClick={() => setShowAll(true)} className="w-full py-2.5 text-xs cursor-pointer transition-colors hover:bg-white/[0.015]" style={{ color: "rgba(255,255,255,0.2)", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          + {filtered.length - displayLimit} meer tonen
        </button>
      )}
    </div>
  );
}
