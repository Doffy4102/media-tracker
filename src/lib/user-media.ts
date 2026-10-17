import prisma from "@/lib/prisma";
import { toUserMediaView } from "@/lib/media-view";
import type { MediaType, UserMediaView, UserStatus } from "@/lib/types";
import type { Prisma } from "@/generated/prisma/client";

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UserMediaPage {
  items: UserMediaView[];
  pagination: Pagination;
  counts: Record<string, number>;
}

export interface ListUserMediaQuery {
  userId: string;
  status?: UserStatus | null;
  types?: string[];
  sort?: string | null;
  page?: number;
  pageSize?: number;
}

function buildOrderBy(sort?: string | null): Prisma.UserMediaOrderByWithRelationInput {
  switch (sort) {
    case "title":
      return { mediaItem: { title: "asc" } };
    case "title_desc":
      return { mediaItem: { title: "desc" } };
    case "year":
      return { mediaItem: { year: "desc" } };
    case "year_asc":
      return { mediaItem: { year: "asc" } };
    case "rating":
      return { rating: "desc" };
    case "rating_asc":
      return { rating: "asc" };
    case "progress":
      return { progress: "desc" };
    case "dateAdded":
      return { createdAt: "desc" };
    case "dateAdded_asc":
      return { createdAt: "asc" };
    default:
      return { updatedAt: "desc" };
  }
}

function clampPageSize(value?: number): number {
  if (value == null || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(Math.floor(value), 1), MAX_PAGE_SIZE);
}

export async function listUserMedia(query: ListUserMediaQuery): Promise<UserMediaPage> {
  const { userId, status, types, sort } = query;
  const pageSize = clampPageSize(query.pageSize);

  const where: Prisma.UserMediaWhereInput = { userId };
  if (status) where.status = status;
  if (types && types.length > 0) {
    where.mediaItem =
      types.length === 1
        ? { type: types[0] as MediaType }
        : { type: { in: types as MediaType[] } };
  }

  const total = await prisma.userMedia.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = query.page != null && Number.isFinite(query.page) ? Math.floor(query.page) : 1;
  const page = Math.min(Math.max(requestedPage, 1), totalPages);

  const [rows, groups] = await Promise.all([
    prisma.userMedia.findMany({
      where,
      include: { mediaItem: true },
      orderBy: buildOrderBy(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.userMedia.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  const counts: Record<string, number> = { ALL: 0 };
  for (const group of groups) {
    counts[group.status] = group._count._all;
    counts.ALL += group._count._all;
  }

  return {
    items: rows.map(toUserMediaView),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
    counts,
  };
}
