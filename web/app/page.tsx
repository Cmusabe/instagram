import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HomePage } from "@/components/HomePage";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main><HomePage locale="nl" /></main>
      <Footer />
    </div>
  );
}
