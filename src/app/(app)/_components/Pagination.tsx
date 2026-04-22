import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  paramName?: string;
  otherParams?: Record<string, string | undefined>;
  labels: {
    previous: string;
    next: string;
    pageOfTotal: string;
    totalItems: string;
  };
};

export function Pagination({
  page,
  totalPages,
  total,
  basePath,
  paramName = "page",
  otherParams = {},
  labels,
}: Props) {
  if (total === 0) return null;

  const makeHref = (p: number): string => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(otherParams)) {
      if (v !== undefined && v !== "") sp.set(k, v);
    }
    if (p > 1) sp.set(paramName, String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  const disabledCls =
    "cursor-not-allowed rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-zinc-400";
  const activeCls =
    "rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-100";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-stretch gap-2 border-t border-zinc-100 bg-white px-4 py-3 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>{labels.totalItems}</div>
      <div className="flex items-center justify-end gap-2">
        <span className="font-mono">{labels.pageOfTotal}</span>
        {prevDisabled ? (
          <span className={disabledCls} aria-disabled="true">
            {labels.previous}
          </span>
        ) : (
          <Link href={makeHref(page - 1)} className={activeCls}>
            {labels.previous}
          </Link>
        )}
        {nextDisabled ? (
          <span className={disabledCls} aria-disabled="true">
            {labels.next}
          </span>
        ) : (
          <Link href={makeHref(page + 1)} className={activeCls}>
            {labels.next}
          </Link>
        )}
      </div>
    </nav>
  );
}
