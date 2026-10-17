import type { MediaProvider } from "@/lib/types";

export function withFallback(
  primary: MediaProvider,
  fallback: MediaProvider,
): MediaProvider {
  const attempt = async <T>(
    operation: string,
    primaryCall: () => Promise<T>,
    fallbackCall: () => Promise<T>,
  ): Promise<T> => {
    try {
      return await primaryCall();
    } catch (error) {
      console.warn(
        `[media-providers] ${primary.source} ${operation} failed; falling back to ${fallback.source}:`,
        error,
      );
      return fallbackCall();
    }
  };

  const composite: MediaProvider = {
    source: primary.source,
    search: (query, type) =>
      attempt(
        "search",
        () => primary.search(query, type),
        () => fallback.search(query, type),
      ),
    details: (apiId, type) =>
      attempt(
        "details",
        () => primary.details(apiId, type),
        () => fallback.details(apiId, type),
      ),
  };

  const watchProviders = primary.watchProviders;
  if (watchProviders) {
    composite.watchProviders = (apiId, type, title) =>
      watchProviders.call(primary, apiId, type, title);
  }

  return composite;
}
