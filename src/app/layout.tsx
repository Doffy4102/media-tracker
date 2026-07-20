import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import AuthStatus from "@/components/AuthStatus";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Media Tracker",
  description: "Track your anime, manga, movies, TV series, and books",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Media Tracker
              </span>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <AuthStatus />
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <div className="flex-1 animate-fade-in">{children}</div>
      </body>
    </html>
  );
}
