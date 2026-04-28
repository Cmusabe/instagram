import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HomePage } from "@/components/HomePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "InstaClean \u2014 Cancel All Your Instagram Follow Requests",
  description: "Cancel hundreds of Instagram follow requests at once. 100% free, safe, and local in your browser.",
  alternates: { languages: { nl: "/" } },
};

export default function HomeEN() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main><HomePage locale="en" /></main>
      <Footer />
    </div>
  );
}
