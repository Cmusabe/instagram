"use client";

import { useState, useCallback, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UsernameUpload } from "@/components/tool/username-upload";
import { UsernameList } from "@/components/tool/username-list";
import { ConfigPanel } from "@/components/tool/config-panel";
import { ScriptOutput } from "@/components/tool/script-output";
import { Instructions } from "@/components/tool/instructions";
import { LiveProgress } from "@/components/tool/LiveProgress";
import { SessionHistory } from "@/components/tool/SessionHistory";
import { ResultsDashboard } from "@/components/tool/ResultsDashboard";
import { AccountAnalyzer } from "@/components/tool/AccountAnalyzer";
import { useToast } from "@/components/Toast";
import { generateScript, estimateTime, validateUsernames } from "@/lib/generate-script";
import { Sparkles, AlertTriangle } from "lucide-react";
import { track } from "@/lib/track";
import { ExtensionBridge } from "@/components/tool/ExtensionBridge";

export default function ToolPage() {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [invalidNames, setInvalidNames] = useState<{ name: string; reason: string }[]>([]);
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(0);
  const [delay, setDelay] = useState(6);
  const [batchSize, setBatchSize] = useState(15);
  const [batchPause, setBatchPause] = useState(90);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [showLive, setShowLive] = useState(false);
  const [results, setResults] = useState<{ cancelled: number; skipped: number; failed: number; total: number; durationMs: number } | null>(null);
  const { toast } = useToast();

  // Listen for script completion
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("instaclean_progress");
      channel.onmessage = (event: MessageEvent) => {
        const d = event.data;
        if (d?.type === "done") {
          setResults(d);
          toast(`Klaar! ${d.cancelled} requests geannuleerd.`, "success");
          track("script_completed", { cancelled: d.cancelled, skipped: d.skipped, failed: d.failed, durationMs: d.durationMs });
        }
        if (d?.type === "already_done") {
          setShowLive(true); // Make sure live panel is visible
          toast(`Alle ${d.total} usernames waren al eerder verwerkt.`, "info");
        }
        if (d?.type === "start") {
          setShowLive(true);
        }
      };
    } catch { /* BroadcastChannel not available */ }
    return () => { if (channel) channel.close(); };
  }, [toast]);

  const activeStep = showLive ? 4 : generatedScript ? 3 : usernames.length > 0 ? 2 : 1;

  const estimate = usernames.length > 0 ? estimateTime(usernames.length, delay, batchSize, batchPause) : null;

  const handleUsernamesParsed = useCallback((raw: string[]) => {
    const result = validateUsernames(raw);
    setUsernames(result.valid);
    setInvalidNames(result.invalid);
    setDuplicatesRemoved(result.duplicatesRemoved);

    let msg = `${result.valid.length} geldige usernames gevonden`;
    if (result.duplicatesRemoved > 0) msg += ` (${result.duplicatesRemoved} duplicaten verwijderd)`;
    if (result.invalid.length > 0) msg += ` (${result.invalid.length} ongeldige genegeerd)`;
    toast(msg, result.invalid.length > 0 ? "info" : "success");
    track("upload", { count: result.valid.length, invalid: result.invalid.length, duplicates: result.duplicatesRemoved });
  }, [toast]);

  const handleGenerate = () => {
    const script = generateScript({ usernames, delaySeconds: delay, batchSize, batchPauseSeconds: batchPause });
    setGeneratedScript(script);
    toast("Script gegenereerd! Kopieer en plak het in je Instagram browser tab.", "success");
    track("generate_script", { count: usernames.length, delay, batchSize, batchPause });
  };

  const handleScriptCopied = () => {
    setShowLive(true);
    track("copy_script", { count: usernames.length });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="tool" />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5 w-full">
        <div style={{ animation: "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
          <h1 className="text-2xl sm:text-3xl font-bold">Follow Requests Annuleren</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Upload je data of plak usernames om te beginnen.
          </p>
        </div>

        {/* Session history */}
        <SessionHistory />

        {/* Step progress */}
        <div className="flex items-center justify-center gap-0 py-3">
          {[
            { n: 1, label: "Upload" },
            { n: 2, label: "Configureer" },
            { n: 3, label: "Genereer" },
            { n: 4, label: "Uitvoeren" },
          ].map((step, i) => (
            <div key={step.n} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
                  style={{
                    background: step.n <= activeStep ? "linear-gradient(135deg, #D946EF, #8B5CF6)" : "rgba(255,255,255,0.03)",
                    color: step.n <= activeStep ? "white" : "rgba(255,255,255,0.25)",
                    border: step.n > activeStep ? "1px solid rgba(255,255,255,0.05)" : "none",
                    boxShadow: step.n === activeStep ? "0 0 16px rgba(217,70,239,0.3)" : "none",
                  }}
                >
                  {step.n < activeStep ? "\u2713" : step.n}
                </div>
                <span className="text-[10px] mt-1 transition-colors" style={{ color: step.n <= activeStep ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)" }}>{step.label}</span>
              </div>
              {i < 3 && (
                <div className="w-10 sm:w-16 h-[2px] mx-1.5 mb-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: step.n < activeStep ? "100%" : "0%", background: "linear-gradient(90deg, #D946EF, #8B5CF6)" }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        <div className="relative rounded-2xl p-5 sm:p-7 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #D946EF, #8B5CF6, #06B6D4)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>1</span>
            <h2 className="text-sm font-semibold">Usernames laden</h2>
          </div>
          <UsernameUpload onUsernamesParsed={handleUsernamesParsed} />
        </div>

        {/* Validation warnings */}
        {(invalidNames.length > 0 || duplicatesRemoved > 0) && (
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}>
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {duplicatesRemoved > 0 && <p>{duplicatesRemoved} duplicaten automatisch verwijderd.</p>}
              {invalidNames.length > 0 && (
                <p className="mt-1">
                  {invalidNames.length} ongeldige usernames genegeerd:{" "}
                  <span className="font-mono text-amber-400/70">
                    {invalidNames.slice(0, 3).map(n => n.name).join(", ")}
                    {invalidNames.length > 3 && ` (+${invalidNames.length - 3} meer)`}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Steps 2+ */}
        {usernames.length > 0 && (
          <div className="space-y-5" style={{ animation: "fadeUp 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
            <UsernameList usernames={usernames} onClear={() => { setUsernames([]); setGeneratedScript(null); setShowLive(false); setResults(null); setInvalidNames([]); setDuplicatesRemoved(0); }} />

            {/* Account Analysis */}
            {usernames.length >= 10 && <AccountAnalyzer usernames={usernames} />}

            {/* Step 2: Config */}
            <div className="rounded-2xl p-5 sm:p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>2</span>
                <h2 className="text-sm font-semibold">Configureer</h2>
              </div>
              <ConfigPanel delay={delay} batchSize={batchSize} batchPause={batchPause} onDelayChange={setDelay} onBatchSizeChange={setBatchSize} onBatchPauseChange={setBatchPause} />
              {estimate && (
                <div className="mt-4 p-3 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Geschatte tijd: </span>
                  <span className="text-sm font-bold text-grad">{estimate}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}> voor {usernames.length} accounts</span>
                </div>
              )}
            </div>

            {/* Step 3a: Extension Bridge (preferred) */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>3</span>
              <h2 className="text-sm font-semibold">Uitvoeren</h2>
            </div>
            <ExtensionBridge usernames={usernames} config={{ delay, batchSize, batchPause }} />

            {/* Step 3b: Script fallback */}
            <details className="group">
              <summary className="flex items-center gap-2 py-3 text-xs cursor-pointer list-none" style={{ color: "rgba(255,255,255,0.25)" }}>
                <span className="transition-transform duration-200 group-open:rotate-90">&#9654;</span>
                Alternatief: handmatig script (voor gevorderde gebruikers)
              </summary>
            <div className="rounded-2xl p-5 sm:p-7 mt-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Script methode</span>
              </div>
              {!generatedScript ? (
                <button
                  onClick={handleGenerate}
                  className="btn-primary w-full py-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={16} />
                  Genereer script voor {usernames.length} accounts
                </button>
              ) : (
                <div className="space-y-5">
                  <ScriptOutput script={generatedScript} onCopied={handleScriptCopied} />
                  <div className="pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <Instructions />
                  </div>
                </div>
              )}
            </div>
            </details>

            {/* Step 4: Live progress or Results */}
            {showLive && (
              <div style={{ animation: "fadeUp 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>4</span>
                  <h2 className="text-sm font-semibold">{results ? "Resultaat" : "Live voortgang"}</h2>
                </div>
                {results ? (
                  <ResultsDashboard
                    cancelled={results.cancelled}
                    skipped={results.skipped}
                    failed={results.failed}
                    total={results.total}
                    durationMs={results.durationMs}
                    usernames={usernames}
                    onReset={() => {
                      setUsernames([]);
                      setGeneratedScript(null);
                      setShowLive(false);
                      setResults(null);
                    }}
                  />
                ) : (
                  <LiveProgress />
                )}
              </div>
            )}

            {/* Warning */}
            <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.08)" }}>
              <p className="text-xs" style={{ color: "rgba(245,158,11,0.7)" }}>
                <span className="font-semibold">Let op:</span> Dit script gebruikt Instagram&apos;s interne API. Bij rate limiting pauzeert het script automatisch. Houd het browser-tabblad met Instagram open.
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
