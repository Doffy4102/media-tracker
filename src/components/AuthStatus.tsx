"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initialsOf(name?: string, email?: string) {
  return (name || email || "?").trim().slice(0, 1).toUpperCase();
}

export default function AuthStatus() {
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? null);
        } else {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (loading) return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/auth/login">
          <Button variant="ghost" size="sm" className="text-xs transition-all duration-200 hover:scale-105">Sign in</Button>
        </Link>
        <Link href="/auth/register">
          <Button size="sm" className="text-xs transition-all duration-200 hover:scale-105">Sign up</Button>
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/profile"
      aria-label="Profile"
      className="rounded-full transition-all duration-200 hover:scale-105 active:scale-[0.97]"
    >
      <Avatar size="sm">
        <AvatarFallback className="bg-primary/20 font-semibold text-primary">
          {initialsOf(user.name, user.email)}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
