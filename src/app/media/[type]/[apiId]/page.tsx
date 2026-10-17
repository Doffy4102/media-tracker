"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trash2, ExternalLink, Plus, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RatingStars } from "@/components/RatingStars";
import {
  MediaTypeLabels,
  UserStatusOptionsByMediaType,
  DEFAULT_STATUS_BY_MEDIA_TYPE,
  DEFAULT_STREAMING_SITES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MediaPageData, MediaType, UserMediaView, UserStatus } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function MediaPage({
  params,
}: {
  params: Promise<{ type: string; apiId: string }>;
}) {
  const { type, apiId } = use(params);
  const router = useRouter();

  const [data, setData] = useState<MediaPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [status, setStatus] = useState<UserStatus | "">("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [progress, setProgress] = useState<number | "">("");

  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/media/lookup?type=${encodeURIComponent(type)}&apiId=${encodeURIComponent(apiId)}`)
      .then((r) => {
        if (r.status === 404) throw new Error("not-found");
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((page: MediaPageData) => {
        if (cancelled) return;
        setData(page);
        const um = page.userMedia;
        setStatus(um?.status ?? DEFAULT_STATUS_BY_MEDIA_TYPE[page.mediaItem.type]);
        setRating(um?.rating ?? 0);
        setReview(um?.review ?? "");
        setProgress(um?.progress ?? "");
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error && e.message === "not-found" ? "Title not found" : "Failed to load this title");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [type, apiId]);

  const media = data?.mediaItem;
  const userMedia: UserMediaView | null = data?.userMedia ?? null;
  const statusOptions = media
    ? UserStatusOptionsByMediaType[media.type as MediaType]
    : [];

  const add = async () => {
    if (!media || adding) return;
    setAdding(true);
    setActionError("");
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            title: media.title,
            type: media.type,
            apiId: media.apiId,
            posterUrl: media.posterUrl,
            year: media.year,
            genres: media.genres,
            description: media.description,
            totalProgress: media.totalProgress,
            externalScore: media.externalScore,
            apiSource: media.apiSource,
            status: status || DEFAULT_STATUS_BY_MEDIA_TYPE[media.type as MediaType],
          },
        }),
      });
      if (!res.ok) throw new Error("add failed");
      const out = await res.json();
      const um: UserMediaView = out.userMedia;
      setData((d) => (d ? { ...d, userMedia: um, mediaItem: um.mediaItem } : d));
      setStatus(um.status);
      setRating(um.rating ?? 0);
      setReview(um.review ?? "");
      setProgress(um.progress ?? "");
    } catch {
      setActionError("Couldn't add this title. Try again.");
    } finally {
      setAdding(false);
    }
  };

  const save = async () => {
    if (!userMedia || saving) return;
    setSaving(true);
    setActionError("");
    try {
      const res = await fetch(`/api/media/${userMedia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status || undefined,
          rating: rating || undefined,
          review: review || undefined,
          progress: progress !== "" ? Number(progress) : undefined,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      const out = await res.json();
      const um: UserMediaView = out.userMedia;
      setData((d) => (d ? { ...d, userMedia: um, mediaItem: um.mediaItem } : d));
    } catch {
      setActionError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!userMedia || removing) return;
    if (!confirm("Are you sure you want to remove this entry?")) return;
    setRemoving(true);
    setActionError("");
    try {
      const res = await fetch(`/api/media/${userMedia.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setData((d) => (d ? { ...d, userMedia: null } : d));
      setStatus(media ? DEFAULT_STATUS_BY_MEDIA_TYPE[media.type as MediaType] : "");
      setRating(0);
      setReview("");
      setProgress("");
    } catch {
      setActionError("Failed to remove entry");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="w-32 h-8" />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-8 w-2/3 rounded-lg" />
              <Skeleton className="h-4 w-1/3 rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !media || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center space-y-4 animate-scale-in">
          <div className="rounded-full bg-destructive/10 p-3 w-fit mx-auto">
            <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <p className="text-destructive font-medium">{loadError || "Title not found"}</p>
          <Button variant="outline" onClick={() => router.push("/")} className="transition-all duration-200 hover:scale-105">
            Back to Showcase
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-2 group transition-all duration-200 hover:-translate-x-1">
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="animate-fade-in-up relative aspect-[2/3] w-full bg-muted rounded-xl overflow-hidden shadow-lg transition-all duration-500 hover:shadow-2xl hover:shadow-foreground/10 group/image">
            {media.posterUrl ? (
              <Image src={media.posterUrl} alt={media.title} fill className="object-cover transition-all duration-700 group-hover/image:scale-105" sizes="300px" priority />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No image</div>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="animate-fade-in-up stagger-1">
              <h1 className="font-heading text-3xl font-bold tracking-tight">{media.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="transition-all duration-200 hover:scale-105">{MediaTypeLabels[media.type] || media.type}</Badge>
                {media.year && <span className="text-sm text-muted-foreground">{media.year}</span>}
                {media.externalScore != null && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1 ml-auto">
                    <svg className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {media.externalScore.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {media.description && (
              <p className="text-muted-foreground leading-relaxed animate-fade-in-up stagger-2">{media.description}</p>
            )}

            {media.watchSources && media.watchSources.length > 0 && (
              <div className="animate-fade-in-up stagger-2">
                <h3 className="text-sm font-medium mb-3">Watch</h3>
                <div className="flex flex-wrap gap-2">
                  {media.watchSources.map((ws, i) => (
                    <a
                      key={`${ws.name}-${i}`}
                      href={ws.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-foreground/20 hover:shadow-sm active:scale-[0.97]"
                    >
                      {ws.logoPath && (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${ws.logoPath}`}
                          alt={ws.name}
                          width={20}
                          height={20}
                          className="rounded object-contain"
                        />
                      )}
                      {ws.name}
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                        {ws.type === "flatrate" ? "Stream" : ws.type === "rent" ? "Rent" : ws.type === "buy" ? "Buy" : "Free"}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {["ANIME", "MOVIE", "TV_SERIES"].includes(media.type) && (
              <div className="animate-fade-in-up stagger-2">
                <h3 className="text-sm font-medium mb-3">Stream Free</h3>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_STREAMING_SITES.map((site) => (
                    <a
                      key={site.domain}
                      href={site.searchUrl(media.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-foreground/20 hover:shadow-sm active:scale-[0.97]"
                    >
                      {site.name}
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Separator className="animate-fade-in-up stagger-2" />

            {userMedia ? (
              <Card className="animate-fade-in-up stagger-3 border-border/50 shadow-sm transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Your Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={status} onValueChange={(v) => { if (v) setStatus(v as UserStatus); }}>
                      <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-ring">
                        <SelectValue placeholder="Select status">
                          {status ? statusOptions.find((o) => o.value === status)?.label : ""}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rating</label>
                    <RatingStars value={rating} onChange={setRating} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Progress</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={media.totalProgress ?? undefined}
                        value={progress}
                        onChange={(e) => setProgress(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="0"
                        className="w-20 transition-all duration-200 focus:ring-2 focus:ring-ring"
                      />
                      {media.totalProgress != null && (
                        <span className="text-sm text-muted-foreground">
                          / {media.totalProgress}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Review</label>
                    <Textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Write your review..."
                      rows={4}
                      className="transition-all duration-200 focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {actionError && (
                    <p className="text-xs text-destructive">{actionError}</p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={save}
                      disabled={saving || removing}
                      className="transition-all duration-200 hover:scale-105 active:scale-[0.97]"
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </span>
                      ) : "Save Changes"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={remove}
                      disabled={saving || removing}
                      className="transition-all duration-200 hover:scale-105 active:scale-[0.97]"
                    >
                      {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : data.authed ? (
              <Card className="animate-fade-in-up stagger-3 border-border/50 shadow-sm transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Add to Library</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Add as</label>
                    <Select value={status} onValueChange={(v) => { if (v) setStatus(v as UserStatus); }}>
                      <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-ring">
                        <SelectValue placeholder="Select status">
                          {status ? statusOptions.find((o) => o.value === status)?.label : ""}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {actionError && (
                    <p className="text-xs text-destructive">{actionError}</p>
                  )}

                  <Button onClick={add} disabled={adding} className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
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
                </CardContent>
              </Card>
            ) : (
              <div className="animate-fade-in-up stagger-3 space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">Sign in to add this to your library.</p>
                <Link href="/auth/login" className={cn(buttonVariants(), "w-full")}>
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-muted rounded-md animate-pulse ${className}`} />;
}
