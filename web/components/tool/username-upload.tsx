"use client";

import { useCallback, useState, type DragEvent } from "react";
import { usePathname } from "next/navigation";
import { parseFile, parseUsernameText } from "@/lib/parse-html";
import { Upload, CheckCircle, FileText, Keyboard } from "lucide-react";

const strings = {
  nl: {
    tabUpload: "Bestand uploaden",
    tabUploadShort: "Upload",
    tabPaste: "Handmatig invoeren",
    tabPasteShort: "Plakken",
    dragText: "Sleep je Instagram export hierheen",
    dragRelease: "Laat los om te uploaden!",
    fileLoaded: "Bestand geladen",
    fileHint: "HTML, JSON of TXT \u2014 klik of sleep",
    tip: "Ga naar Instagram > Instellingen > Je informatie downloaden > Volgers en volgend > HTML of JSON formaat",
    pasteLabel: "Plak hieronder de Instagram usernames die je wilt annuleren, \u00e9\u00e9n per regel (zonder @):",
    pasteButton: "Verwerk usernames",
  },
  en: {
    tabUpload: "Upload file",
    tabUploadShort: "Upload",
    tabPaste: "Enter manually",
    tabPasteShort: "Paste",
    dragText: "Drag your Instagram export here",
    dragRelease: "Drop to upload!",
    fileLoaded: "File loaded",
    fileHint: "HTML, JSON or TXT \u2014 click or drag",
    tip: "Go to Instagram > Settings > Download your information > Followers and following > HTML or JSON format",
    pasteLabel: "Paste the Instagram usernames you want to cancel below, one per line (without @):",
    pasteButton: "Process usernames",
  },
};

interface Props {
  onUsernamesParsed: (usernames: string[]) => void;
}

export function UsernameUpload({ onUsernamesParsed }: Props) {
  const pathname = usePathname();
  const isEN = pathname.startsWith("/en");
  const t = isEN ? strings.en : strings.nl;

  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [pasteText, setPasteText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const usernames = parseFile(content, file.name);
        onUsernamesParsed(usernames);
      };
      reader.readAsText(file);
    },
    [onUsernamesParsed]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    const usernames = parseUsernameText(pasteText);
    onUsernamesParsed(usernames);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { id: "upload" as const, icon: <FileText size={14} />, label: t.tabUpload, short: t.tabUploadShort },
          { id: "paste" as const, icon: <Keyboard size={14} />, label: t.tabPaste, short: t.tabPasteShort },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer"
            style={{
              background: mode === tab.id ? "linear-gradient(135deg, #D946EF, #8B5CF6)" : "rgba(255,255,255,0.03)",
              color: mode === tab.id ? "white" : "#94a3b8",
              border: mode === tab.id ? "none" : "1px solid rgba(255,255,255,0.06)",
              boxShadow: mode === tab.id ? "0 0 15px rgba(217,70,239,0.25)" : "none",
            }}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.short}</span>
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-all duration-500"
            style={{
              minHeight: 200,
              borderColor: dragOver ? "#D946EF" : fileName ? "#10b981" : "rgba(255,255,255,0.08)",
              background: dragOver ? "rgba(217,70,239,0.04)" : fileName ? "rgba(16,185,129,0.03)" : "rgba(255,255,255,0.01)",
              boxShadow: dragOver ? "0 0 40px rgba(217,70,239,0.08)" : "none",
              transform: dragOver ? "scale(1.01)" : "scale(1)",
            }}
          >
            <div className="mb-3" style={!fileName ? { animation: "float 2.5s ease-in-out infinite" } : undefined}>
              {fileName ? (
                <CheckCircle size={32} className="text-emerald-400" />
              ) : (
                <Upload size={32} className={`transition-all duration-300 ${dragOver ? "scale-125" : ""}`} style={{ color: dragOver ? "#D946EF" : "rgba(255,255,255,0.25)" }} />
              )}
            </div>
            <p className="text-base font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
              {dragOver ? t.dragRelease : fileName ? fileName : t.dragText}
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              {fileName ? t.fileLoaded : t.fileHint}
            </p>
            <input
              type="file"
              accept=".html,.htm,.json,.txt,.csv"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Upload Instagram data export"
            />
          </div>
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.2)" }}>{t.tip}</p>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{t.pasteLabel}</p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"travel_adventures\nphoto_daily\nfitness_queen\namsterdam_life\nmusic_lover_nl"}
            rows={8}
            className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all duration-300 resize-none"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", minHeight: 180 }}
          />
          <button
            onClick={handlePaste}
            disabled={!pasteText.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)", boxShadow: "0 4px 15px rgba(217,70,239,0.25)" }}
          >
            {t.pasteButton}
          </button>
        </div>
      )}
    </div>
  );
}
