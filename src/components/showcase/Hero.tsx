"use client";

import Image from "next/image";
import Link from "next/link";
import { Info, Plus, Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MediaTypeLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ShowcaseItem } from "@/lib/types";

export default function Hero({
  item,
  isAuthed,
  onSelect,
}: {
  item: ShowcaseItem;
  isAuthed: boolean;
  onSelect: (item: ShowcaseItem) => void;
}) {
  const background = item.backdropUrl ?? item.posterUrl;

  return (
    <section className="relative h-[65vh] min-h-[440px] w-full overflow-hidden sm:h-[75vh]">
      {background && (
        <Image
          src={background}
          alt={item.title}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-28 sm:px-6 sm:pb-36 lg:px-8">
        <Badge className="w-fit border-none bg-primary/90 text-primary-foreground">
          {MediaTypeLabels[item.type] ?? item.type}
        </Badge>
        <h1 className="mt-3 max-w-2xl font-heading text-3xl font-bold drop-shadow sm:text-5xl">
          {item.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {item.year && <span>{item.year}</span>}
          {item.externalScore != null && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {item.externalScore.toFixed(1)}
            </span>
          )}
          {item.genres.slice(0, 3).map((genre) => (
            <span key={genre} className="rounded-full bg-muted/70 px-2 py-0.5 text-xs">
              {genre}
            </span>
          ))}
        </div>
        {item.description && (
          <p className="mt-4 line-clamp-3 max-w-xl text-sm text-muted-foreground">
            {item.description}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {item.libraryId ? (
            <Link href={`/media/${item.libraryId}`} className={cn(buttonVariants({ size: "lg" }))}>
              View in Library
            </Link>
          ) : (
            <Button size="lg" onClick={() => onSelect(item)}>
              <Plus />
              {isAuthed ? "Add to Library" : "Sign in to add"}
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={() => onSelect(item)}>
            <Info />
            More info
          </Button>
        </div>
      </div>
    </section>
  );
}
