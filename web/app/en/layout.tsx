import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "InstaClean \u2014 Cancel All Your Instagram Follow Requests",
  description: "Cancel hundreds of Instagram follow requests at once. 100% free, safe, and local in your browser.",
  openGraph: {
    title: "InstaClean",
    description: "Cancel hundreds of Instagram follow requests at once. 100% free, safe, and local.",
    locale: "en_US",
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <div lang="en">{children}</div>;
}
