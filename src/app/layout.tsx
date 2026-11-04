import type { Metadata } from "next";
import { Poppins, Righteous } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { QuickSearchProvider } from "@/components/quick-search";
import { Toaster } from "@/components/ui/toast";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const righteous = Righteous({
  variable: "--font-righteous",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Media Shelf",
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
      suppressHydrationWarning
      className={`${poppins.variable} ${righteous.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <QuickSearchProvider>
          <NavBar />
          <div className="flex-1 animate-fade-in">{children}</div>
          <Toaster />
        </QuickSearchProvider>
      </body>
    </html>
  );
}
