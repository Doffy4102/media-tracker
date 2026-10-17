"use client";

import type { Showcase as ShowcaseData } from "@/lib/types";
import Hero from "@/components/showcase/Hero";
import MediaRow from "@/components/showcase/MediaRow";

export default function Showcase({
  data,
  isAuthed,
}: {
  data: ShowcaseData;
  isAuthed: boolean;
}) {
  const recent = data.recent ?? [];
  const hasRows = recent.length > 0 || data.rows.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {data.hero && <Hero item={data.hero} isAuthed={isAuthed} />}

      <div className="relative z-10 -mt-12 mx-auto max-w-7xl space-y-10 px-4 pb-16 sm:-mt-20 sm:px-6 lg:px-8">
        {hasRows ? (
          <>
            {recent.length > 0 && (
              <MediaRow title="Recently Added" items={recent} index={0} />
            )}
            {data.rows.map((row, index) => (
              <MediaRow
                key={row.key}
                title={row.title}
                items={row.items}
                index={index + (recent.length > 0 ? 1 : 0)}
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
    </div>
  );
}
