import { Globe, Terminal, MonitorSmartphone, ClipboardPaste, Clock } from "lucide-react";
import type { ReactNode } from "react";

export function Instructions() {
  const steps: { icon: ReactNode; title: string; description: string }[] = [
    {
      icon: <Globe size={16} />,
      title: "Ga naar Instagram",
      description:
        "Open instagram.com in Chrome en zorg dat je ingelogd bent.",
    },
    {
      icon: <Terminal size={16} />,
      title: "Open Developer Tools",
      description:
        "Druk F12 (of Cmd+Option+J op Mac) om DevTools te openen.",
    },
    {
      icon: <MonitorSmartphone size={16} />,
      title: "Ga naar Console",
      description:
        'Klik op het "Console" tabblad. Typ allow pasting als er een waarschuwing staat.',
    },
    {
      icon: <ClipboardPaste size={16} />,
      title: "Plak het script",
      description:
        "Plak het gekopieerde script (Ctrl+V / Cmd+V) en druk Enter.",
    },
    {
      icon: <Clock size={16} />,
      title: "Wacht tot het klaar is",
      description:
        "Het script toont real-time voortgang. Laat de tab open staan!",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text">
        Hoe het script uitvoeren
      </h3>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex gap-4 items-start p-4 rounded-xl bg-surface-elevated/50 border border-border/50"
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-r from-primary to-accent">
              {i + 1}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-primary">{step.icon}</span>
                <p className="text-sm font-semibold text-text">{step.title}</p>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
