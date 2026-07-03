const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1";

function getBooksKey(): string | undefined {
  return process.env.GOOGLE_BOOKS_API_KEY;
}

export async function searchBooks(query: string) {
  const key = getBooksKey();
  const url = `${GOOGLE_BOOKS_BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=20${key ? `&key=${key}` : ""}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Google Books API error");
  const data = await res.json();
  return (data.items || []).map((item: Record<string, unknown>) => {
    const info = item.volumeInfo as Record<string, unknown>;
    const imageLinks = info.imageLinks as Record<string, unknown> | undefined;
    return {
      id: `google_books_${item.id}`,
      title: info.title as string,
      type: "BOOK" as const,
      apiId: item.id as string,
      posterUrl: (imageLinks?.thumbnail as string)
        ?.replace("http:", "https:")
        ?.replace("zoom=1", "zoom=3"),
      year: (info.publishedDate as string)?.slice(0, 4) ? parseInt((info.publishedDate as string).slice(0, 4)) : undefined,
      genres: (info.categories as string[]) || [],
      description: info.description as string,
      apiSource: "google_books",
      externalUrl: info.infoLink as string,
      totalProgress: (info.pageCount as number) ?? undefined,
      externalScore: (info.averageRating as number) ?? undefined,
    };
  });
}

export async function getBooksDetails(id: string) {
  const key = getBooksKey();
  const url = `${GOOGLE_BOOKS_BASE}/volumes/${id}${key ? `?key=${key}` : ""}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Google Books API error");
  const item: Record<string, unknown> = await res.json();
  const info = item.volumeInfo as Record<string, unknown>;
  const imageLinks = info.imageLinks as Record<string, unknown> | undefined;
  return {
    id: `google_books_${item.id}`,
    title: info.title as string,
    type: "BOOK" as const,
    apiId: item.id as string,
    posterUrl: (imageLinks?.thumbnail as string)
        ?.replace("http:", "https:")
        ?.replace("zoom=1", "zoom=3"),
    year: (info.publishedDate as string)?.slice(0, 4) ? parseInt((info.publishedDate as string).slice(0, 4)) : undefined,
    genres: (info.categories as string[]) || [],
    description: info.description as string,
    apiSource: "google_books",
    externalUrl: info.infoLink as string,
    externalScore: (info.averageRating as number) ?? undefined,
    totalProgress: (info.pageCount as number) ?? undefined,
  };
}
