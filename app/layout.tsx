import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tool-making-agent.example.com"),
  title: "The Tool-Making Agent | Build AI Tools During Live Conversations",
  description:
    "A platform where AI agents build, test, and deploy custom instruments during real conversations so teams stop hitting fixed-tool bottlenecks.",
  openGraph: {
    title: "The Tool-Making Agent",
    description:
      "Let AI agents create custom tools in real time, run them in a sandbox, and persist capabilities for future workflows.",
    url: "https://tool-making-agent.example.com",
    siteName: "The Tool-Making Agent",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Tool-Making Agent",
    description:
      "Agents can build and iterate their own tools on the fly instead of stalling on missing functions.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
