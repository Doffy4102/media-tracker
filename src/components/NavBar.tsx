"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import AuthStatus from "@/components/AuthStatus";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Media Tracker
          </span>
          <Link href="/dashboard" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105">
            Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <AuthStatus />
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="sm:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="sm:hidden border-t border-border bg-background/95 backdrop-blur-xl animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <div className="pt-2 border-t border-border">
              <AuthStatus />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
