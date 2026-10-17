"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PosterTile from "@/components/showcase/PosterTile";
import type { ShowcaseItem } from "@/lib/types";

export default function MediaRow({
  title,
  items,
  index,
}: {
  title: string;
  items: ShowcaseItem[];
  index: number;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollByPage = (direction: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const arrowClass =
    "rounded-full border border-border bg-background/80 p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <section className="animate-fade-in-up" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="font-heading text-lg font-bold sm:text-2xl">{title}</h2>
        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label={`Scroll ${title} left`}
            className={arrowClass}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label={`Scroll ${title} right`}
            className={arrowClass}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0"
      >
        {items.map((item) => (
          <PosterTile key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
