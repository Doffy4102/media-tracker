export default function ShowcaseSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="h-[65vh] min-h-[440px] w-full bg-muted animate-shimmer sm:h-[75vh]" />
      <div className="relative z-10 -mt-12 mx-auto max-w-7xl space-y-10 px-4 pb-16 sm:-mt-20 sm:px-6 lg:px-8">
        {[0, 1, 2].map((row) => (
          <div key={row} className="space-y-3">
            <div className="h-6 w-48 rounded bg-muted animate-shimmer" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] w-32 flex-shrink-0 rounded-xl bg-muted animate-shimmer sm:w-36 md:w-40"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
