"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ImportState = "idle" | "parsing" | "importing" | "results";

interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  total: number;
  errors: string[];
}

export default function MalImportDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport?: () => void;
}) {
  const [state, setState] = useState<ImportState>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [previewCount, setPreviewCount] = useState<{ anime: number; manga: number } | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const xmlTextRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setState("idle");
    setFileName("");
    setPreviewCount(null);
    setResult(null);
    xmlTextRef.current = "";
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) reset();
      onOpenChange(v);
    },
    [onOpenChange, reset],
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setState("parsing");

    try {
      const arrayBuf = await file.arrayBuffer();
      let text: string;

      if (file.name.endsWith(".gz")) {
        const ds = new DecompressionStream("gzip");
        const writer = ds.writable.getWriter();
        writer.write(new Uint8Array(arrayBuf));
        writer.close();
        const decompressed = await new Response(ds.readable).arrayBuffer();
        text = new TextDecoder("utf-8").decode(decompressed);
      } else {
        text = new TextDecoder("utf-8").decode(arrayBuf);
      }

      let animeCount = 0;
      let mangaCount = 0;

      if (/<anime[\s>]/i.test(text) || /<series_animedb_id>/i.test(text)) {
        animeCount = (text.match(/<series_animedb_id>/g) ?? []).length;
      }
      if (/<manga[\s>]/i.test(text) || /<manga_mangadb_id>/i.test(text)) {
        mangaCount = (text.match(/<manga_mangadb_id>/g) ?? []).length;
      }

      if (animeCount === 0 && mangaCount === 0) {
        throw new Error("No anime or manga entries found in this XML file.");
      }

      xmlTextRef.current = text;
      setPreviewCount({ anime: animeCount, manga: mangaCount });
      setState("idle");
    } catch (err) {
      setState("idle");
      setFileName("");
      xmlTextRef.current = "";
      if (inputRef.current) inputRef.current.value = "";
      alert(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  const handleImport = async () => {
    const xml = xmlTextRef.current;
    if (!xml) return;

    setState("importing");

    try {
      const res = await fetch("/api/import/mal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      setResult(data);
      setState("results");
      onImport?.();
    } catch (err) {
      setState("idle");
      alert(err instanceof Error ? err.message : "Import failed");
    }
  };

  const totalEntries = previewCount
    ? previewCount.anime + previewCount.manga
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from MyAnimeList</DialogTitle>
        </DialogHeader>

        {state === "results" && result ? (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-primary/10 p-3">
                <p className="text-2xl font-bold text-primary">{result.imported}</p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-2xl font-bold">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-2xl font-bold text-destructive">{result.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-3 space-y-1">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">{err}</p>
                ))}
              </div>
            )}

            <Button onClick={() => handleOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        ) : state === "importing" ? (
          <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium">Importing {totalEntries} entries...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Fetching metadata from MAL. This may take a while.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept=".xml,.xml.gz,.gz"
              className="hidden"
              onChange={handleFileSelect}
            />

            {previewCount ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{fileName}</p>
                    <div className="flex gap-2 mt-1">
                      {previewCount.anime > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {previewCount.anime} anime
                        </Badge>
                      )}
                      {previewCount.manga > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {previewCount.manga} manga
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <p>Existing entries in your list will be skipped.</p>
                  <p>New entries will be enriched with poster, genres, and description from MyAnimeList.</p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleImport} className="flex-1">
                    <Upload className="h-4 w-4 mr-1.5" />
                    Import {totalEntries} entries
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center gap-3 w-full rounded-lg border-2 border-dashed border-border p-8 text-center hover:border-primary/50 hover:bg-muted/30 transition-all duration-200"
              >
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Select XML file</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload your MyAnimeList export (.xml or .xml.gz)
                  </p>
                </div>
              </button>
            )}

            <div className="rounded-lg bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">How to export from MAL:</p>
              <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                <li>Go to <span className="font-mono">myanimelist.net/panel.php?go=export</span></li>
                <li>Select Anime List or Manga List</li>
                <li>Click &quot;Export My List&quot;</li>
                <li>Upload the downloaded file here</li>
              </ol>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
