"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Loader2, ArrowLeft, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MediaType } from "@/lib/types";
import { MediaTypeLabels, UserStatusOptions } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MediaTypeFilter = "ALL" | MediaType;

export default function SearchDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedType, setSelectedType] = useState<MediaTypeFilter>("ALL");
  const [selectedResult, setSelectedResult] = useState<Record<string, unknown> | null>(null);
  const [addStatus, setAddStatus] = useState("PLANTOWATCH");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (!open) {
      setSelectedResult(null);
      setAddStatus("PLANTOWATCH");
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

  const handleAdd = async () => {
    if (!selectedResult) return;
    setAdding(true);
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            title: selectedResult.title as string,
            type: selectedResult.type as string,
            apiId: selectedResult.apiId as string,
            posterUrl: selectedResult.posterUrl as string,
            year: selectedResult.year as number,
            genres: selectedResult.genres as string[],
            description: selectedResult.description as string,
            totalProgress: selectedResult.totalProgress as number | undefined,
            status: addStatus,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onOpenChange(false);
        setQuery("");
        setResults([]);
        setSelectedResult(null);
        setAddStatus("PLANTOWATCH");
        onAdd?.();
        router.push(`/media/${data.userMedia.id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const backToSearch = () => {
    setSelectedResult(null);
    setAddStatus("PLANTOWATCH");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {selectedResult ? (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={backToSearch}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to search
            </button>

            <div className="flex gap-4">
              <div className="relative w-24 h-36 flex-shrink-0 bg-muted rounded-lg overflow-hidden shadow-md">
                {selectedResult.posterUrl ? (
                  <Image
                    src={selectedResult.posterUrl as string}
                    alt={selectedResult.title as string}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <h3 className="font-semibold text-base leading-tight">{selectedResult.title as string}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {MediaTypeLabels[selectedResult.type as MediaType] || (selectedResult.type as string)}
                  </Badge>
                  {(selectedResult.year as number | undefined) != null && (
                    <span className="text-xs text-muted-foreground">{String(selectedResult.year)}</span>
                  )}
                </div>
                {(selectedResult.genres as string[] | undefined) != null && (selectedResult.genres as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(selectedResult.genres as string[]).slice(0, 4).map((g) => (
                      <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                {(selectedResult.description as string | undefined) && (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {selectedResult.description as string}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Add as</label>
              <Select value={addStatus} onValueChange={(v) => { if (v) setAddStatus(v); }}>
                <SelectTrigger className="w-full transition-all duration-200 focus:ring-2 focus:ring-ring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UserStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {adding ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add to List
                  </span>
                )}
              </Button>
              <Button variant="outline" onClick={backToSearch} disabled={adding}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Add Media</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Search anime, manga, movies, TV, books..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {(["ALL", "ANIME", "MANGA", "MOVIE", "TV_SERIES", "BOOK"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={selectedType === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(t)}
                    className="text-xs"
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
                <div className="grid grid-cols-2 gap-3 p-1">
                  {results.map((result, i) => (
                    <button
                      key={result.id as string}
                      onClick={() => setSelectedResult(result)}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
