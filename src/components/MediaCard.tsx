"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MediaTypeLabels, UserStatusLabels } from "@/lib/constants";

function getStatusStyle(status: string) {
  switch (status) {
    case "WATCHING":
      return {
        bg: "bg-blue-500/90",
        border: "border-blue-400/60",
        text: "text-white",
      };
    case "COMPLETED":
      return {
        bg: "bg-green-500/90",
        border: "border-green-400/60",
        text: "text-white",
      };
    case "PLANTOWATCH":
      return {
        bg: "bg-amber-500/90",
        border: "border-amber-400/60",
        text: "text-white",
      };
    case "DROPPED":
      return {
        bg: "bg-red-500/90",
        border: "border-red-400/60",
        text: "text-white",
      };
    default:
      return {
        bg: "bg-muted",
        border: "border-border",
        text: "text-foreground",
      };
  }
}

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
}

interface UserMediaItemShape {
  id: string;
  status?: string;
  rating?: number;
  progress?: number;
  mediaItem?: MediaItemShape;
  [key: string]: unknown;
}

export default function MediaCard({ item }: { item: UserMediaItemShape }) {
  const mediaItem: MediaItemShape = (item.mediaItem || item) as unknown as MediaItemShape;
  const status = item.status;
  const style = status ? getStatusStyle(status) : null;
  const rating = item.rating ?? 0;
  const progress = item.progress ?? 0;
  const total = mediaItem.totalProgress;
  const showProgress = total != null && total > 0;

  return (
    <Link href={`/media/${item.id}`}>
      <Card className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98]">
        <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="relative aspect-[2/3] bg-muted overflow-hidden">
          {mediaItem.posterUrl ? (
            <Image
              src={mediaItem.posterUrl}
              alt={mediaItem.title}
              fill
              className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
          <div className="absolute top-2 right-2 transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-0.5">
            <Badge className="bg-primary/90 text-primary-foreground border-none shadow-sm text-xs">
              {MediaTypeLabels[mediaItem.type] || mediaItem.type}
            </Badge>
          </div>
          <div className="absolute bottom-2 left-2 flex flex-col gap-1.5">
            {status && style && (
              <Badge
                variant="outline"
                className={`text-xs font-semibold border backdrop-blur-sm ${style.bg} ${style.text} ${style.border} shadow-sm`}
              >
                {UserStatusLabels[status] || status}
              </Badge>
            )}
          </div>
          {showProgress && (
            <div className="absolute bottom-2 right-2">
              <div className="text-[11px] font-medium text-white bg-background/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 border border-white/10 shadow-sm">
                {progress}/{total}
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-3 relative space-y-1">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">{mediaItem.title}</h3>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{mediaItem.year}</p>
            {rating > 0 && (
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-0.5">
                {rating}
                <svg className="h-3 w-3 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
