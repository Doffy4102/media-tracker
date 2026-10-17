import type { Metadata } from "next";
import { Poppins, Righteous } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

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
      className={`${poppins.variable} ${righteous.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <NavBar />
        <div className="flex-1 animate-fade-in">{children}</div>
      </body>
    </html>
  );
}
