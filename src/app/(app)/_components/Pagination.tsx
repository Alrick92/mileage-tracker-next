import Link from "next/link";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { localeTag, translator, type Locale } from "@/lib/i18n";

type Labels = {
  previous: string;
  next: string;
  pageOfTotal: string;
  totalItems: string;
};

type Props = {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  paramName?: string;
  otherParams?: Record<string, string | undefined>;
  labels: Labels;
};

/** Standard translated labels for <Pagination>. */
export function paginationLabels(
  locale: Locale,
  page: number,
  totalPages: number,
  total: number,
): Labels {
  const t = translator(locale);
  const tag = localeTag(locale);
  return {
    previous: t("pagination.previous"),
    next: t("pagination.next"),
    pageOfTotal: t("pagination.pageOfTotal", {
      page: page.toLocaleString(tag),
      total: totalPages.toLocaleString(tag),
    }),
    totalItems: t("pagination.totalItems", {
      count: total.toLocaleString(tag),
    }),
  };
}

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

  const base =
    "inline-flex min-h-10 items-center gap-1 rounded-lg border px-3 text-xs font-medium transition md:min-h-8";
  const disabledCls = `${base} cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300`;
  const activeCls = `${base} border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 active:scale-95`;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t border-zinc-100 bg-white px-4 py-3 text-xs text-zinc-500"
    >
      <div className="hidden sm:block">{labels.totalItems}</div>
      <span className="font-mono sm:hidden">{labels.pageOfTotal}</span>
      <div className="flex items-center gap-2">
        <span className="hidden font-mono sm:inline">{labels.pageOfTotal}</span>
        {prevDisabled ? (
          <span className={disabledCls} aria-disabled="true">
            <ChevronLeftIcon width={14} height={14} />
            {labels.previous}
          </span>
        ) : (
          <Link href={makeHref(page - 1)} className={activeCls} rel="prev">
            <ChevronLeftIcon width={14} height={14} />
            {labels.previous}
          </Link>
        )}
        {nextDisabled ? (
          <span className={disabledCls} aria-disabled="true">
            {labels.next}
            <ChevronRightIcon width={14} height={14} />
          </span>
        ) : (
          <Link href={makeHref(page + 1)} className={activeCls} rel="next">
            {labels.next}
            <ChevronRightIcon width={14} height={14} />
          </Link>
        )}
      </div>
    </nav>
  );
}
