"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Plus, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaTypeLabels, UserStatusOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ShowcaseItem } from "@/lib/types";

function PreviewBody({
  item,
  isAuthed,
  onClose,
}: {
  item: ShowcaseItem;
  isAuthed: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState("PLANTOWATCH");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const add = async () => {
    setAdding(true);
    setError(false);
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            title: item.title,
            type: item.type,
            apiId: item.apiId,
            posterUrl: item.posterUrl,
            year: item.year,
            genres: item.genres,
            description: item.description,
            totalProgress: item.totalProgress,
            externalScore: item.externalScore,
            apiSource: item.apiSource,
            status,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to add media");
      const data = await res.json();
      onClose();
      router.push(`/media/${data.userMedia.id}`);
    } catch {
      setError(true);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <DialogTitle className="sr-only">{item.title}</DialogTitle>

      <div className="flex gap-4">
        <div className="relative h-40 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {item.posterUrl ? (
            <Image src={item.posterUrl} alt={item.title} fill className="object-cover" sizes="112px" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="font-heading text-lg font-semibold leading-tight">{item.title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-[10px]">
              {MediaTypeLabels[item.type] ?? item.type}
            </Badge>
            {item.year && <span>{item.year}</span>}
            {item.externalScore != null && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {item.externalScore.toFixed(1)}
              </span>
            )}
          </div>
          {item.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.genres.slice(0, 4).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
          {item.description && (
            <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {isAuthed ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Add as</label>
            <Select
              value={status}
              onValueChange={(value) => {
                if (value) setStatus(value);
              }}
            >
              <SelectTrigger className="w-full">
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
          {error && (
            <p className="text-xs text-destructive">Couldn&apos;t add this title. Try again.</p>
          )}
          <Button onClick={add} disabled={adding} className="w-full">
            {adding ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add to Library
              </span>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 text-center">
          <p className="text-sm text-muted-foreground">Sign in to add this to your library.</p>
          <Link href="/auth/login" className={cn(buttonVariants(), "w-full")}>
            Sign in
          </Link>
        </div>
      )}
    </>
  );
}

export default function ShowcasePreview({
  item,
  isAuthed,
  onOpenChange,
}: {
  item: ShowcaseItem | null;
  isAuthed: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {item && (
          <PreviewBody key={item.id} item={item} isAuthed={isAuthed} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
