"use client";

import { useEffect, useState } from "react";
import MediaCard from "@/components/MediaCard";
import SearchDialog from "@/components/SearchDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaTypeOptions } from "@/lib/constants";

type TabStatus = "PLANTOWATCH" | "WATCHING" | "COMPLETED" | "DROPPED" | "ALL";

interface MediaItemShape {
  id: string;
  title: string;
  type: string;
  posterUrl?: string;
  year?: number;
  description?: string;
  genres?: string[];
  apiId?: string;
  totalProgress?: number;
  externalScore?: number;
  apiSource?: string;
}

interface DashboardItem {
  id: string;
  status: string;
  rating?: number;
  review?: string;
  progress?: number;
  mediaItem: MediaItemShape;
  [key: string]: unknown;
}

const sortOptions = [
  { value: "updatedAt", label: "Recently Updated" },
  { value: "rating", label: "Score (Highest)" },
  { value: "rating_asc", label: "Score (Lowest)" },
  { value: "title", label: "Title (A-Z)" },
  { value: "title_desc", label: "Title (Z-A)" },
  { value: "year", label: "Year (Newest)" },
  { value: "year_asc", label: "Year (Oldest)" },
  { value: "dateAdded", label: "Recently Added" },
  { value: "dateAdded_asc", label: "Oldest Added" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>("ALL");
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState("updatedAt");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/media")
      .then((r) => r.json())
      .then((data) => {
        const all: DashboardItem[] = data.userMedia || [];
        const c: Record<string, number> = { ALL: all.length };
        for (const item of all) {
          const s = item.status as string;
          c[s] = (c[s] || 0) + 1;
        }
        setCounts(c);
      })
      .catch(() => {});
  }, []);

  const fetchItems = (tab: TabStatus, sort: string, types: string[]) => {
    const params = new URLSearchParams();
    if (tab !== "ALL") params.set("status", tab);
    params.set("sort", sort);
    if (types.length > 0) params.set("type", types.join(","));
    fetch(`/api/media?${params}`)
      .then((r) => r.json())
      .then((data) => setItems(data.userMedia || []))
      .catch(console.error);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab !== "ALL") params.set("status", activeTab);
    params.set("sort", sortBy);
    if (typeFilters.length > 0) params.set("type", typeFilters.join(","));
    fetch(`/api/media?${params}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setItems(data.userMedia || []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, sortBy, typeFilters]);

  const toggleType = (type: string) => {
    setTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const refresh = () => {
    fetchItems(activeTab, sortBy, typeFilters);
    fetch("/api/media")
      .then((r) => r.json())
      .then((data) => {
        const all: DashboardItem[] = data.userMedia || [];
        const c: Record<string, number> = { ALL: all.length };
        for (const item of all) {
          const s = item.status as string;
          c[s] = (c[s] || 0) + 1;
        }
        setCounts(c);
      })
      .catch(() => {});
  };

  const tabs: { value: TabStatus; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "PLANTOWATCH", label: "Plan to Watch" },
    { value: "WATCHING", label: "Watching" },
    { value: "COMPLETED", label: "Completed" },
    { value: "DROPPED", label: "Dropped" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <header className="sticky top-[3.5rem] z-40 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Dashboard</h1>
          <Button
            onClick={() => setSearchOpen(true)}
            className="transition-all duration-200 hover:scale-105 active:scale-[0.97]"
          >
            + Add Media
          </Button>
        </div>
      </header>

      <div className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.value
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className="ml-1 text-xs text-muted-foreground/60">
                  ({counts[tab.value] ?? 0})
                </span>
                {activeTab === tab.value && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Sort by</span>
            <Select value={sortBy} onValueChange={(v) => { if (v) setSortBy(v); }}>
              <SelectTrigger className="h-8 w-44 text-xs transition-all duration-200 focus:ring-2 focus:ring-ring">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground mr-1">Type</span>
            {MediaTypeOptions.map((opt) => {
              const active = typeFilters.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleType(opt.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-2 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="aspect-[2/3] bg-muted rounded-xl animate-shimmer rounded-md" />
                <div className="h-4 bg-muted rounded animate-shimmer rounded w-3/4" />
                <div className="h-3 bg-muted rounded animate-shimmer rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
            </div>
            <p className="text-muted-foreground mb-4">No media found</p>
            <Button onClick={() => setSearchOpen(true)}>Add your first entry</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item, i) => (
              <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <MediaCard item={item} />
              </div>
            ))}
          </div>
        )}
      </main>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} onAdd={refresh} />
    </div>
  );
}
