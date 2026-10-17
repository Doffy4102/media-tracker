"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MediaType } from "@/lib/types";
import { MediaTypeLabels } from "@/lib/constants";

type MediaTypeFilter = "ALL" | MediaType;

export default function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<MediaTypeFilter>("ALL");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!query || query.trim().length < 2) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query.trim() });
        if (selectedType !== "ALL") params.set("type", selectedType);
        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => { clearTimeout(timer); setResults([]); };
  }, [query, selectedType]);

  const openTitle = (result: Record<string, unknown>) => {
    onOpenChange(false);
    router.push(`/media/${result.type}/${encodeURIComponent(result.apiId as string)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Search</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search anime, manga, movies, TV, books, games..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {(["ALL", "ANIME", "MANGA", "MOVIE", "TV_SERIES", "BOOK", "GAME"] as const).map((t) => (
              <Button
                key={t}
                variant={selectedType === t ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(t)}
                className="shrink-0 text-xs"
              >
                {t === "ALL" ? "All" : MediaTypeLabels[t as MediaType] || t}
              </Button>
            ))}
          </div>
        </div>
        <ScrollArea className="max-h-[60vh]">
          {loading && query.length >= 2 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 && query.length >= 2 ? (
            <p className="text-center text-sm text-muted-foreground py-8 animate-fade-in">No results found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
              {results.map((result, i) => (
                <button
                  key={result.id as string}
                  onClick={() => openTitle(result)}
                  className="flex gap-3 p-2 rounded-lg border border-border hover:bg-accent hover:border-foreground/20 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="relative w-12 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
                    {result.posterUrl ? (
                      <Image
                        src={result.posterUrl as string}
                        alt={result.title as string}
                        fill
                        className="object-cover transition-all duration-300 group-hover:scale-110"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-2 leading-tight">{result.title as string}</p>
                    <p className="text-xs text-muted-foreground mt-1">{result.year as string}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {MediaTypeLabels[result.type as MediaType] || (result.type as string)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
