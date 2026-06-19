import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI System Health Guardian",
  description: "Enterprise AI infrastructure and mining operations monitoring",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
