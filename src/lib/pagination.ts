export const DEFAULT_PAGE_SIZE = 10;

export function parsePage(
  raw: string | string[] | undefined,
  totalPages: number,
): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = value ? parseInt(value, 10) : 1;
  if (!Number.isFinite(n) || n < 1) return 1;
  if (totalPages > 0 && n > totalPages) return totalPages;
  return n;
}

export function computeTotalPages(
  total: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function computeSkip(
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): number {
  return Math.max(0, (page - 1) * pageSize);
}
