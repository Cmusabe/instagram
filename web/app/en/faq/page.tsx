import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { FaqContent } from "@/components/FaqContent";

export const metadata: Metadata = {
  title: "FAQ \u2014 InstaClean",
  description: "Frequently asked questions about InstaClean.",
};

const FAQS_EN = [
  { q: "Is this safe to use?", a: "The script runs entirely locally in your browser. We never have access to your account or password. You can fully inspect the script before running it." },
  { q: "Do I need to enter my password?", a: "No! You log into Instagram yourself in your browser. The script uses your existing session. We never ask for your password." },
  { q: "Can my account get blocked?", a: "Instagram may apply rate limiting with frequent automated actions. The script has built-in pauses to prevent this. Increase the delay if you still get blocked. A temporary block usually lasts 30\u201360 minutes." },
  { q: "How long does it take to cancel everything?", a: "That depends on the number of accounts and your settings. With default settings (2s delay, batches of 100): ~500 accounts per hour. For 4000 accounts it\u2019s ~2\u20133 hours." },
  { q: "Can I stop and continue later?", a: "Yes! The script saves progress in your browser (localStorage). When you run it again, previously processed accounts are skipped." },
  { q: "What if the script stops or crashes?", a: "No problem. Thanks to progress tracking, you can simply paste and run the script again. It continues where it left off." },
  { q: "How do I get my Instagram data export?", a: "Go to Instagram Settings > Accounts Center > Download your information > Select \u2018Followers and following\u2019 > Choose HTML format. Download the file when it\u2019s ready." },
  { q: "Can I enter usernames manually?", a: "Yes! In the tool you can choose to paste usernames directly instead of uploading an HTML file. Put each username on a new line." },
  { q: "Does this work on mobile?", a: "The script needs to run in a browser console, which is easiest on desktop (Chrome, Firefox, Edge). On mobile this is technically difficult." },
  { q: "Is my data stored anywhere?", a: "No. All processing happens locally in your browser. No data is sent to our servers. The website is fully static." },
];

export default function FaqEN() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-[700px] mx-auto px-6 pt-40 pb-20">
        <Reveal>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Frequently Asked Questions
          </h1>
          <p className="mt-2 text-[1rem]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Everything you need to know about InstaClean.
          </p>
        </Reveal>
        <FaqContent faqs={FAQS_EN} />
        <div className="text-center mt-10">
          <a href="/en/tool" className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)", boxShadow: "0 0 16px rgba(217,70,239,0.2)" }}>
            Go to tool
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
