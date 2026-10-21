import type { Metadata, Viewport } from "next";
import { Libre_Caslon_Text } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const caslon = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-word",
});

export const metadata: Metadata = {
  title: "Parole",
  description: "Personal Italian vocabulary review",
  appleWebApp: { capable: true, title: "Parole", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5f8" },
    { media: "(prefers-color-scheme: dark)", color: "#10151d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={caslon.variable}>
      <body>
        <main className="page">{children}</main>
        <nav className="tabs" aria-label="Main">
          <Link href="/">Today</Link>
          <Link href="/words/new">Add</Link>
          <Link href="/words">Words</Link>
        </nav>
      </body>
    </html>
  );
}
