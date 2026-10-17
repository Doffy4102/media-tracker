const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRY_WINDOW_MS = 15000;
const DEFAULT_MAX_ATTEMPTS = 3;

export interface JsonRequestOptions {
  revalidate?: number;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retryWindowMs?: number;
  maxAttempts?: number;
  label?: string;
}

export async function fetchJson<T>(
  url: string,
  options: JsonRequestOptions = {},
): Promise<T> {
  const {
    revalidate,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retryWindowMs = DEFAULT_RETRY_WINDOW_MS,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    label = url,
  } = options;

  const deadline = Date.now() + retryWindowMs;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Network failures (including our own timeout) propagate immediately: a host
    // that is unreachable will not recover within a backoff, so retrying only
    // burns time. Only rate-limit / server errors are retried.
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
      ...(revalidate !== undefined ? { next: { revalidate } } : {}),
    });

    if (res.ok) {
      return (await res.json()) as T;
    }

    const retryable = res.status === 429 || res.status >= 500;
    const canRetry =
      retryable && attempt < maxAttempts - 1 && Date.now() < deadline;
    if (!canRetry) {
      throw new Error(`Request failed (HTTP ${res.status}) for ${label}`);
    }

    const retryAfter = res.headers.get("retry-after");
    const waitMs = retryAfter
      ? parseInt(retryAfter, 10) * 1000
      : 1500 * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, waitMs));
  }

  throw new Error(`Request failed after ${maxAttempts} attempts for ${label}`);
}
