"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MediaTypeLabels, UserStatusLabels } from "@/lib/constants";

function getStatusColor(status: string) {
  switch (status) {
    case "WATCHING":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "COMPLETED":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "PLANTOWATCH":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "DROPPED":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "";
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
}

interface UserMediaItemShape {
  id: string;
  status?: string;
  [key: string]: unknown;
}

export default function MediaCard({ item }: { item: UserMediaItemShape }) {
  const mediaItem: MediaItemShape = (item.mediaItem || item) as unknown as MediaItemShape;

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
          <div className="absolute bottom-2 left-2 transition-all duration-200 group-hover:translate-y-0.5">
            {item.status && (
              <Badge variant="outline" className={`text-xs shadow-sm backdrop-blur-sm ${getStatusColor(item.status)}`}>
                {UserStatusLabels[item.status] || item.status}
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-3 relative">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">{mediaItem.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{mediaItem.year}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
