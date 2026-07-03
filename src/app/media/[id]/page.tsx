"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RatingStars } from "@/components/RatingStars";
import { MediaTypeLabels, UserStatusOptions } from "@/lib/constants";
import type { UserStatus, MediaType } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function MediaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [status, setStatus] = useState<UserStatus | "">("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [progress, setProgress] = useState<number | "">("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/media/${id}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((data) => {
        if (cancelled) return;
        const um = data.userMedia as Record<string, unknown>;
        setItem(um);
        setStatus(um.status as UserStatus);
        setRating((um.rating as number) || 0);
        setReview((um.review as string) || "");
        setProgress((um.progress as number | null) ?? "");
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setError("Failed to load media entry"); });
    return () => { cancelled = true; };
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status || undefined,
          rating: rating || undefined,
          review: review || undefined,
          progress: progress !== "" ? Number(progress) : undefined,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      window.location.reload();
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Are you sure you want to remove this entry?")) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/dashboard");
    } catch {
      setError("Failed to delete entry");
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

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center space-y-4 animate-scale-in">
          <div className="rounded-full bg-destructive/10 p-3 w-fit mx-auto">
            <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <p className="text-destructive font-medium">{error || "Entry not found"}</p>
          <Button variant="outline" onClick={() => router.push("/dashboard")} className="transition-all duration-200 hover:scale-105">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const media = item.mediaItem as { id: string; title: string; type: MediaType; posterUrl?: string; year?: number; description?: string; genres?: string[]; totalProgress?: number };

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
              <Image src={media.posterUrl} alt={media.title} fill className="object-cover transition-all duration-700 group-hover/image:scale-105" sizes="300px" />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No image</div>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="animate-fade-in-up stagger-1">
              <h1 className="text-3xl font-bold tracking-tight">{media.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="transition-all duration-200 hover:scale-105">{MediaTypeLabels[media.type] || media.type}</Badge>
                {media.year && <span className="text-sm text-muted-foreground">{media.year}</span>}
              </div>
            </div>

            {media.description && (
              <p className="text-muted-foreground leading-relaxed animate-fade-in-up stagger-2">{media.description}</p>
            )}

            <Separator className="animate-fade-in-up stagger-2" />

            <Card className="animate-fade-in-up stagger-3 border-border/50 shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Your Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={status} onValueChange={(v) => setStatus(v as UserStatus)}>
                    <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-ring">
                      <SelectValue placeholder="Select status" />
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

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={save}
                    disabled={saving}
                    className="transition-all duration-200 hover:scale-105 active:scale-[0.97]"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Saving...
                      </span>
                    ) : "Save Changes"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={remove}
                    className="transition-all duration-200 hover:scale-105 active:scale-[0.97]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-muted rounded-md animate-pulse ${className}`} />;
}
