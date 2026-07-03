"use client";

interface RatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export function RatingStars({ value, max = 10, onChange, readonly = false }: RatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const ratingValue = i + 1;
        const filled = ratingValue <= value;
        const animDelay = (i * 0.05).toFixed(2);
        const animStyle = filled ? { animation: `star-fill 0.3s ease-out ${animDelay}s both` } : undefined;
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(ratingValue)}
            className={`p-0.5 transition-all duration-150 ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-125 hover:-translate-y-0.5"
            } ${filled ? "active:scale-90" : ""}`}
            aria-label={`Rate ${ratingValue} out of ${max}`}
          >
            <svg
              className={`h-5 w-5 transition-all duration-200 ${
                filled
                  ? "text-yellow-500 fill-yellow-500 drop-shadow-sm"
                  : "text-muted-foreground/40 hover:text-muted-foreground/60"
              }`}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={animStyle}
            >
              <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.6l5.34-.78L10 1z" />
            </svg>
          </button>
        );
      })}
      <span className="ml-2 text-sm text-muted-foreground tabular-nums font-medium">{value || 0}/10</span>
    </div>
  );
}
