"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaType, MediaSearchResult } from "@/lib/types";
import { MediaTypeLabels } from "@/lib/constants";

const TYPE_ORDER: MediaType[] = ["ANIME", "MANGA", "MOVIE", "TV_SERIES", "BOOK", "GAME"];

type TypeFilter = "ALL" | MediaType;

const TYPE_FILTERS: TypeFilter[] = ["ALL", ...TYPE_ORDER];

const MAX_PER_TYPE = 4;
const MIN_QUERY_LENGTH = 2;

interface Section {
  type: MediaType;
  rawCount: number;
  rows: { result: MediaSearchResult; index: number }[];
}

export default function QuickSearchPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [notAuthed, setNotAuthed] = useState(false);
  const [selectedType, setSelectedType] = useState<TypeFilter>("ALL");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open || query.trim().length < MIN_QUERY_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setNotAuthed(false);
      try {
        const params = new URLSearchParams({ q: query.trim() });
        if (selectedType !== "ALL") params.set("type", selectedType);
        const res = await fetch(`/api/search?${params}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (res.status === 401) {
          setNotAuthed(true);
          setResults([]);
          return;
        }
        const data: { results?: MediaSearchResult[] } = await res.json();
        if (controller.signal.aborted) return;
        setResults(data.results ?? []);
        setActiveIndex(data.results?.length ? 0 : -1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
      setLoading(false);
    };
  }, [open, query, selectedType]);

  const sections = useMemo<Section[]>(() => {
    let index = 0;
    if (selectedType === "ALL") {
      return TYPE_ORDER.map((type) => {
        const matched = results.filter((r) => r.type === type);
        return {
          type,
          rawCount: matched.length,
          rows: matched.slice(0, MAX_PER_TYPE).map((result) => ({ result, index: index++ })),
        };
      }).filter((s) => s.rows.length > 0);
    }
    return [
      {
        type: selectedType,
        rawCount: results.length,
        rows: results.map((result) => ({ result, index: index++ })),
      },
    ];
  }, [results, selectedType]);

  const visibleResults = useMemo(
    () => sections.flatMap((s) => s.rows.map((r) => r.result)),
    [sections]
  );
  const rowCount = visibleResults.length;

  useEffect(() => {
    if (activeIndex >= 0) {
      document.getElementById(`quick-search-row-${activeIndex}`)?.scrollIntoView({ block: "nearest", behavior: "instant" as ScrollBehavior });
    }
  }, [activeIndex]);

  const openResult = (result: MediaSearchResult) => {
    onOpenChange(false);
    router.push(`/media/${result.type}/${encodeURIComponent(result.apiId)}`);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (rowCount === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % rowCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + rowCount) % rowCount);
    } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < rowCount) {
      e.preventDefault();
      openResult(visibleResults[activeIndex]);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/40 backdrop-blur-xs duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          className="fixed z-50 flex flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground ring-1 ring-foreground/10 outline-none duration-100 left-1/2 right-auto -translate-x-1/2 top-[8vh] sm:top-[10vh] bottom-auto h-auto max-h-[78dvh] sm:max-h-[80vh] w-[calc(100%-2rem)] max-w-[40rem] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
        <DialogTitle className="sr-only">Quick Search</DialogTitle>

        <div className="border-b border-border">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search anime, manga, movies, TV, books, games…"
              autoFocus
              autoComplete="off"
              role="combobox"
              aria-expanded="true"
              aria-controls="quick-search-listbox"
              aria-autocomplete="list"
              className="h-9 px-1.5 text-base border-0 bg-transparent rounded-none focus-visible:ring-0 focus-visible:border-transparent md:text-base dark:bg-transparent"
            />
            <kbd className="hidden sm:inline-flex h-5 shrink-0 items-center rounded-md border border-border bg-muted/40 px-1.5 text-[10px] font-sans text-muted-foreground">
              esc
            </kbd>
            <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label="Close search">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-4 pb-2.5">
            {TYPE_FILTERS.map((t) => (
              <Button
                key={t}
                variant={selectedType === t ? "default" : "outline"}
                size="xs"
                onClick={() => setSelectedType(t)}
                className="shrink-0 text-xs"
              >
                {t === "ALL" ? "All" : MediaTypeLabels[t]}
              </Button>
            ))}
          </div>
        </div>

        <div
          id="quick-search-listbox"
          role="listbox"
          aria-label="Search results"
          className="flex-1 min-h-0 overflow-y-auto scrollbar-thin space-y-4 px-4 py-3"
        >
          {notAuthed ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <Search className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Sign in to search your Media Sources.</p>
              <Link href="/auth/login" onClick={() => onOpenChange(false)} className={buttonVariants({ size: "sm" })}>
                Sign in
              </Link>
            </div>
          ) : query.trim().length < MIN_QUERY_LENGTH ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Search className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Type at least two characters to search</p>
              <p className="text-xs text-muted-foreground/70">
                Anime · Manga · Movies · TV · Books · Games
              </p>
            </div>
          ) : loading && rowCount === 0 ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg p-2 animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <Skeleton className="h-[64px] w-11 shrink-0 rounded" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : rowCount === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground animate-fade-in">
              No results found
            </p>
          ) : (
            sections.map((section) => (
              <section key={section.type} aria-label={MediaTypeLabels[section.type]}>
                <div className="flex items-baseline justify-between pb-1">
                  <h3 className="font-heading text-xs uppercase tracking-wider text-primary/90">
                    {MediaTypeLabels[section.type]}
                  </h3>
                  {section.rawCount > section.rows.length ? (
                    <button
                      onClick={() => setSelectedType(section.type)}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      show all {section.rawCount}
                    </button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{section.rawCount}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  {section.rows.map(({ result, index }) => {
                    const active = index === activeIndex;
                    return (
                      <button
                        key={result.id}
                        id={`quick-search-row-${index}`}
                        role="option"
                        aria-selected={active}
                        onClick={() => openResult(result)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex items-center gap-3 rounded-lg p-2 text-left transition-colors duration-150 ${
                          active ? "bg-muted/80" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="relative h-[64px] w-11 shrink-0 overflow-hidden rounded bg-muted">
                          {result.posterUrl ? (
                            <Image src={result.posterUrl} alt="" fill sizes="44px" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground/60">
                              No img
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-tight line-clamp-1">{result.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {[
                              result.year,
                              result.externalScore != null ? `★ ${result.externalScore.toFixed(1)}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || " "}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
