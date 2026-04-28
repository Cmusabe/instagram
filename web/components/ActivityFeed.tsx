"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const CITIES = [
  { city: "Amsterdam", flag: "\uD83C\uDDF3\uD83C\uDDF1", count: 847 },
  { city: "Brussels", flag: "\uD83C\uDDE7\uD83C\uDDEA", count: 2103 },
  { city: "Rotterdam", flag: "\uD83C\uDDF3\uD83C\uDDF1", count: 456 },
  { city: "Antwerp", flag: "\uD83C\uDDE7\uD83C\uDDEA", count: 1294 },
  { city: "Utrecht", flag: "\uD83C\uDDF3\uD83C\uDDF1", count: 731 },
  { city: "The Hague", flag: "\uD83C\uDDF3\uD83C\uDDF1", count: 592 },
  { city: "London", flag: "\uD83C\uDDEC\uD83C\uDDE7", count: 3201 },
  { city: "Berlin", flag: "\uD83C\uDDE9\uD83C\uDDEA", count: 1823 },
  { city: "Paris", flag: "\uD83C\uDDEB\uD83C\uDDF7", count: 967 },
  { city: "Barcelona", flag: "\uD83C\uDDEA\uD83C\uDDF8", count: 1456 },
];

interface FeedItem { id: number; city: string; flag: string; count: number; minutesAgo: number; }
let nextId = 0;

function gen(): FeedItem {
  const c = CITIES[Math.floor(Math.random() * CITIES.length)];
  return { id: nextId++, city: c.city, flag: c.flag, count: Math.round(c.count * (0.5 + Math.random())), minutesAgo: Math.floor(Math.random() * 30) + 1 };
}

export function ActivityFeed() {
  const pathname = usePathname();
  const isEN = pathname.startsWith("/en");
  const suffix = isEN ? "requests cancelled" : "requests geannuleerd";

  const [items, setItems] = useState<FeedItem[]>(() => [gen(), gen(), gen()]);

  useEffect(() => {
    const iv = setInterval(() => setItems(prev => [gen(), ...prev].slice(0, 4)), 5000);
    return () => clearInterval(iv);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)", opacity: 1 - i * 0.2, animation: i === 0 ? "fadeUp 0.4s cubic-bezier(0.22,1,0.36,1)" : undefined }}>
          <span className="text-sm">{item.flag}</span>
          <span className="text-xs flex-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            <strong className="text-white/70">{item.city}</strong>{" \u2014 "}
            <span className="text-grad font-semibold">{item.count.toLocaleString()}</span>{" "}{suffix}
          </span>
          <span className="text-[10px] tabular-nums" style={{ color: "rgba(255,255,255,0.15)" }}>{item.minutesAgo}m</span>
        </div>
      ))}
    </div>
  );
}
