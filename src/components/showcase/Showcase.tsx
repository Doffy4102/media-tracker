"use client";

import { useState } from "react";
import type { Showcase as ShowcaseData, ShowcaseItem } from "@/lib/types";
import Hero from "@/components/showcase/Hero";
import MediaRow from "@/components/showcase/MediaRow";
import ShowcasePreview from "@/components/showcase/ShowcasePreview";

export default function Showcase({
  data,
  isAuthed,
}: {
  data: ShowcaseData;
  isAuthed: boolean;
}) {
  const [selected, setSelected] = useState<ShowcaseItem | null>(null);
  const recent = data.recent ?? [];
  const hasRows = recent.length > 0 || data.rows.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {data.hero && <Hero item={data.hero} isAuthed={isAuthed} onSelect={setSelected} />}

      <div className="relative z-10 -mt-12 mx-auto max-w-7xl space-y-10 px-4 pb-16 sm:-mt-20 sm:px-6 lg:px-8">
        {hasRows ? (
          <>
            {recent.length > 0 && (
              <MediaRow title="Recently Added" items={recent} index={0} onSelect={setSelected} />
            )}
            {data.rows.map((row, index) => (
              <MediaRow
                key={row.key}
                title={row.title}
                items={row.items}
                index={index + (recent.length > 0 ? 1 : 0)}
                onSelect={setSelected}
              />
            ))}
          </>
        ) : (
          <div className="py-24 text-center animate-fade-in">
            <p className="text-lg font-medium text-foreground">Couldn&apos;t load any titles</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The catalogues are unavailable right now. Head to your dashboard instead.
            </p>
          </div>
        )}
      </div>

      <ShowcasePreview
        item={selected}
        isAuthed={isAuthed}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
