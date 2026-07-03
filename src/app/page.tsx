"use client";

import Link from "next/link";
import { Film, BookOpen, Tv, Library } from "lucide-react";

const mediaIcons = [
  { Icon: Film, label: "Movies", delay: "stagger-1", x: "-translate-x-20", y: "-translate-y-8" },
  { Icon: Tv, label: "TV Series", delay: "stagger-2", x: "translate-x-20", y: "-translate-y-4" },
  { Icon: Library, label: "Anime & Manga", delay: "stagger-3", x: "-translate-x-16", y: "translate-y-10" },
  { Icon: BookOpen, label: "Books", delay: "stagger-4", x: "translate-x-16", y: "translate-y-8" },
];

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float" style={{ animationDelay: "-2s" }} />
      </div>

      {mediaIcons.map(({ Icon, label, delay, x, y }) => (
        <div
          key={label}
          className={`absolute animate-fade-in opacity-0 ${delay}`}
          style={{ animationDuration: "0.6s", animationFillMode: "forwards" }}
        >
          <div className={`hidden sm:flex flex-col items-center gap-2 ${x} ${y} opacity-20 group-hover:opacity-40 transition-opacity`}>
            <Icon className="w-8 h-8 text-foreground/40" />
            <span className="text-xs text-foreground/30 font-medium">{label}</span>
          </div>
        </div>
      ))}

      <div className="flex flex-col items-center justify-center gap-8 px-4 text-center relative z-10">
        <div className="space-y-4 animate-fade-in-up">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
            Media Tracker
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Track your anime, manga, movies, TV series, and books in one place.
          </p>
        </div>
        <div className="animate-fade-in-up stagger-3">
          <Link
            href="/dashboard"
            className="group inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
          >
            Open Dashboard
            <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
