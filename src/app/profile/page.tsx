"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaTypeLabels } from "@/lib/constants";
import type { MediaType } from "@/lib/types";

interface Me {
  id: string;
  name?: string | null;
  email: string;
}

const TYPE_META: { key: MediaType; color: string }[] = [
  { key: "ANIME", color: "#8b5cf6" },
  { key: "MANGA", color: "#ec4899" },
  { key: "MOVIE", color: "#ef4444" },
  { key: "TV_SERIES", color: "#14b8a6" },
  { key: "BOOK", color: "#f59e0b" },
  { key: "GAME", color: "#3b82f6" },
];

function initialsOf(name?: string, email?: string) {
  return (name || email || "?").trim().slice(0, 1).toUpperCase();
}

function TypeDonut({ typeCounts }: { typeCounts: Record<string, number> }) {
  const known = TYPE_META.filter((m) => (typeCounts[m.key] ?? 0) > 0).map((m) => ({
    key: m.key as string,
    color: m.color,
    count: typeCounts[m.key],
  }));
  const extras = Object.keys(typeCounts)
    .filter((k) => (typeCounts[k] ?? 0) > 0 && !TYPE_META.some((m) => m.key === k))
    .map((k) => ({ key: k, color: "#6b7280", count: typeCounts[k] }));
  const segments = [...known, ...extras];
  const total = segments.reduce((n, s) => n + s.count, 0);

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No titles yet — add your first from the dashboard.
      </p>
    );
  }

  const size = 176;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arcs = segments.map((s, i) => {
    const len = (s.count / total) * c;
    const offset = segments
      .slice(0, i)
      .reduce((n, p) => n + (p.count / total) * c, 0);
    return { ...s, len, offset };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-muted" strokeWidth={stroke} />
          {arcs.map((s) => (
            <circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${s.len} ${c - s.len}`}
              strokeDashoffset={-s.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">titles</span>
        </div>
      </div>
      <ul className="w-full flex-1 space-y-2">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="flex-1">{MediaTypeLabels[s.key] ?? s.key}</span>
            <span className="text-muted-foreground">{s.count}</span>
            <span className="w-10 text-right text-muted-foreground">
              {Math.round((s.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<Me | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [logoutOpen, setLogoutOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = res.ok ? await res.json() : { user: null };
      if (cancelled) return;
      if (!data.user) {
        router.replace("/auth/login");
        return;
      }
      setUser(data.user);
      setNameInput(data.user.name ?? "");
      const media = await fetch("/api/media");
      if (cancelled) return;
      if (media.ok) {
        const mediaData = await media.json();
        setTypeCounts(mediaData.typeCounts ?? {});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("Name is required");
      return;
    }
    if (trimmed === (user?.name ?? "")) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    setSaving(true);
    setNameError(null);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setNameInput(data.user.name ?? "");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const data = await res.json().catch(() => null);
        setNameError(data?.error ?? "Failed to save");
      }
    } catch {
      setNameError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setLogoutOpen(false);
      router.push("/auth/login");
    } catch {}
  };

  if (!user) return <div className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <header className="sticky top-[3.5rem] z-40 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="font-heading text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Profile
          </h1>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
            <Avatar size="lg" className="size-16">
              <AvatarFallback className="bg-primary/20 text-xl font-semibold text-primary">
                {initialsOf(user.name ?? undefined, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="profile-name" className="text-xs font-medium text-muted-foreground">
                  Name
                </label>
                <div className="flex gap-2">
                  <Input
                    id="profile-name"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      setNameError(null);
                    }}
                    placeholder="Your name"
                    className="flex-1"
                  />
                  <Button onClick={saveName} disabled={saving || !nameInput.trim()}>
                    <Save className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">{saving ? "Saving…" : "Save"}</span>
                  </Button>
                </div>
                {nameError && <p className="text-xs text-destructive">{nameError}</p>}
                {saved && !nameError && (
                  <p className="text-xs text-emerald-400 animate-fade-in">Saved</p>
                )}
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Email</span>
                <p className="text-sm">{user.email}</p>
              </div>
              <div className="pt-2">
                <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                  <Button variant="destructive" size="sm" onClick={() => setLogoutOpen(true)}>
                    <LogOut className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Sign out</span>
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sign out</DialogTitle>
                      <DialogDescription>Are you sure you want to sign out?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setLogoutOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleLogout}>
                        Sign out
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 p-6">
            <div>
              <p className="font-heading text-3xl font-bold">
                {Object.values(typeCounts).reduce((n, c) => n + c, 0)}
              </p>
              <p className="text-sm text-muted-foreground">titles in your library</p>
            </div>
            <TypeDonut typeCounts={typeCounts} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
