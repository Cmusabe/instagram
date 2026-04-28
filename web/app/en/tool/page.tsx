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

export default function ToolPageEN() {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [invalidNames, setInvalidNames] = useState<{ name: string; reason: string }[]>([]);
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(0);
  const [delay, setDelay] = useState(30);
  const [batchSize, setBatchSize] = useState(5);
  const [batchPause, setBatchPause] = useState(300);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [showLive, setShowLive] = useState(false);
  const [results, setResults] = useState<{ cancelled: number; skipped: number; failed: number; total: number; durationMs: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("instaclean_progress");
      channel.onmessage = (event: MessageEvent) => {
        if (event.data?.type === "done") {
          setResults(event.data);
          toast(`Done! ${event.data.cancelled} requests cancelled.`, "success");
          track("script_completed", event.data);
        }
      };
    } catch {}
    return () => { if (channel) channel.close(); };
  }, [toast]);

  const activeStep = showLive ? 4 : generatedScript ? 3 : usernames.length > 0 ? 2 : 1;
  const estimate = usernames.length > 0 ? estimateTime(usernames.length, delay, batchSize, batchPause) : null;

  const handleUsernamesParsed = useCallback((raw: string[]) => {
    const result = validateUsernames(raw);
    setUsernames(result.valid);
    setInvalidNames(result.invalid);
    setDuplicatesRemoved(result.duplicatesRemoved);
    let msg = `${result.valid.length} valid usernames found`;
    if (result.duplicatesRemoved > 0) msg += ` (${result.duplicatesRemoved} duplicates removed)`;
    toast(msg, "success");
    track("upload", { count: result.valid.length });
  }, [toast]);

  const handleGenerate = () => {
    setGeneratedScript(generateScript({ usernames, delaySeconds: delay, batchSize, batchPauseSeconds: batchPause }));
    toast("Script generated! Copy and paste it in your Instagram browser tab.", "success");
    track("generate_script", { count: usernames.length });
  };

  const clearAll = () => { setUsernames([]); setGeneratedScript(null); setShowLive(false); setResults(null); setInvalidNames([]); setDuplicatesRemoved(0); };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5 w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Cancel Follow Requests</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Upload your data or paste usernames to get started.</p>
        </div>

        <SessionHistory />

        {/* Step progress */}
        <div className="flex items-center justify-center gap-0 py-3">
          {[{ n: 1, l: "Upload" }, { n: 2, l: "Configure" }, { n: 3, l: "Generate" }, { n: 4, l: "Execute" }].map((step, i) => (
            <div key={step.n} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500" style={{ background: step.n <= activeStep ? "linear-gradient(135deg, #D946EF, #8B5CF6)" : "rgba(255,255,255,0.03)", color: step.n <= activeStep ? "white" : "rgba(255,255,255,0.25)", border: step.n > activeStep ? "1px solid rgba(255,255,255,0.05)" : "none", boxShadow: step.n === activeStep ? "0 0 16px rgba(217,70,239,0.3)" : "none" }}>
                  {step.n < activeStep ? "\u2713" : step.n}
                </div>
                <span className="text-[10px] mt-1" style={{ color: step.n <= activeStep ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)" }}>{step.l}</span>
              </div>
              {i < 3 && <div className="w-10 sm:w-16 h-[2px] mx-1.5 mb-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}><div className="h-full rounded-full transition-all duration-700" style={{ width: step.n < activeStep ? "100%" : "0%", background: "linear-gradient(90deg, #D946EF, #8B5CF6)" }} /></div>}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        <div className="relative rounded-2xl p-5 sm:p-7 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #D946EF, #8B5CF6, #06B6D4)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>1</span>
            <h2 className="text-sm font-semibold">Load usernames</h2>
          </div>
          <UsernameUpload onUsernamesParsed={handleUsernamesParsed} />
        </div>

        {invalidNames.length > 0 && (
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}>
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {invalidNames.length} invalid usernames ignored.
              {duplicatesRemoved > 0 && ` ${duplicatesRemoved} duplicates removed.`}
            </p>
          </div>
        )}

        {usernames.length > 0 && (
          <div className="space-y-5">
            <UsernameList usernames={usernames} onClear={clearAll} />
            {usernames.length >= 10 && <AccountAnalyzer usernames={usernames} />}

            <div className="rounded-2xl p-5 sm:p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>2</span>
                <h2 className="text-sm font-semibold">Configure</h2>
              </div>
              <ConfigPanel delay={delay} batchSize={batchSize} batchPause={batchPause} onDelayChange={setDelay} onBatchSizeChange={setBatchSize} onBatchPauseChange={setBatchPause} />
              {estimate && (
                <div className="mt-4 p-3 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Estimated time: </span>
                  <span className="text-sm font-bold text-grad">{estimate}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}> for {usernames.length} accounts</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl p-5 sm:p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>3</span>
                <h2 className="text-sm font-semibold">Generate script</h2>
              </div>
              {!generatedScript ? (
                <button onClick={handleGenerate} className="btn-primary w-full py-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer">
                  <Sparkles size={16} />Generate script for {usernames.length} accounts
                </button>
              ) : (
                <div className="space-y-5">
                  <ScriptOutput script={generatedScript} onCopied={() => { setShowLive(true); track("copy_script", { count: usernames.length }); }} />
                  <div className="pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}><Instructions /></div>
                </div>
              )}
            </div>

            {showLive && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>4</span>
                  <h2 className="text-sm font-semibold">{results ? "Result" : "Live progress"}</h2>
                </div>
                {results ? <ResultsDashboard cancelled={results.cancelled} skipped={results.skipped} failed={results.failed} total={results.total} durationMs={results.durationMs} usernames={usernames} onReset={clearAll} /> : <LiveProgress />}
              </div>
            )}

            <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.08)" }}>
              <p className="text-xs" style={{ color: "rgba(245,158,11,0.7)" }}>
                <span className="font-semibold">Note:</span> Instagram can enforce cooldowns after many actions. InstaClean now uses calmer defaults and automatically pauses on rate limiting. Keep the Instagram browser tab open.
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
