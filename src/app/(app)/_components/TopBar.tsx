import { logoutAction } from "@/app/actions/auth";
import { LogOutIcon } from "@/components/icons";
import { translator, type Locale } from "@/lib/i18n";

type Props = {
  user: { name: string; email: string; role: "USER" | "ADMIN"; locale: Locale };
};

/** Desktop-only top bar. On mobile the account lives in the "More" sheet. */
export function TopBar({ user }: Props) {
  const t = translator(user.locale);
  return (
    <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-zinc-200/70 bg-zinc-50/80 px-10 backdrop-blur-xl md:flex">
      <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-500">
        <span className="truncate">
          {t("topbar.signedInAs")}{" "}
          <span className="font-medium text-zinc-900">{user.name}</span>
        </span>
        {user.role === "ADMIN" ? (
          <span className="rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-700">
            {t("topbar.admin")}
          </span>
        ) : null}
        <span className="hidden truncate text-zinc-400 lg:inline">
          {user.email}
        </span>
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          <LogOutIcon width={14} height={14} />
          {t("topbar.signOut")}
        </button>
      </form>
    </header>
  );
}
