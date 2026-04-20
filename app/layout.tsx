import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Geist } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/components/ToasterProvider";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap"
});

const siteTitle = "ForgeOps | The Tool-Making Agent";
const siteDescription =
  "Let AI agents build, test, version, and deploy custom tools during live conversations so automation no longer stalls on missing capabilities.";

export const metadata: Metadata = {
  metadataBase: new URL("https://forgeops.ai"),
  title: {
    default: siteTitle,
    template: "%s | ForgeOps"
  },
  description: siteDescription,
  keywords: [
    "tool-making agent",
    "ai agents",
    "dynamic tooling",
    "agent sandbox",
    "agent marketplace",
    "lemonsqueezy"
  ],
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "https://forgeops.ai",
    siteName: "ForgeOps",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription
  },
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className={`${spaceGrotesk.variable} ${plexMono.variable} bg-[#0d1117] text-[#c9d1d9]`}>
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
