"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MediaTypeLabels } from "@/lib/constants";
import type { ShowcaseItem } from "@/lib/types";

function PosterContent({ item }: { item: ShowcaseItem }) {
  return (
    <>
      {item.posterUrl ? (
        <Image
          src={item.posterUrl}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 128px, 160px"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
          No image
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95" />
      <Badge className="absolute left-2 top-2 border-none bg-primary/90 text-[10px] text-primary-foreground">
        {MediaTypeLabels[item.type] ?? item.type}
      </Badge>
      <div className="absolute inset-x-0 bottom-0 space-y-0.5 p-2">
        <p className="line-clamp-2 text-xs font-medium leading-tight text-foreground">
          {item.title}
        </p>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{item.year ?? ""}</span>
          {item.externalScore != null && (
            <span className="flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
              {item.externalScore.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export default function PosterTile({
  item,
  onSelect,
}: {
  item: ShowcaseItem;
  onSelect: (item: ShowcaseItem) => void;
}) {
  const className =
    "group relative block aspect-[2/3] w-32 flex-shrink-0 snap-start overflow-hidden rounded-xl bg-muted text-left shadow-sm ring-1 ring-border/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-36 md:w-40";

  if (item.libraryId) {
    return (
      <Link href={`/media/${item.libraryId}`} className={className}>
        <PosterContent item={item} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onSelect(item)} className={className}>
      <PosterContent item={item} />
    </button>
  );
}
