import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { Cursor } from "@/components/cursor";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "NOVA — Plan. Collaborate. Deliver.",
  description: "Team productivity platform for projects, tasks and progress.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen`}>
        {children}
        <Cursor />
      </body>
    </html>
  );
}