import { logoutAction } from "@/app/actions/auth";
import { translator, type Locale } from "@/lib/i18n";

type Props = {
  user: { name: string; email: string; role: "USER" | "ADMIN"; locale: Locale };
};

export function TopBar({ user }: Props) {
  const t = translator(user.locale);
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 md:px-10">
      <div className="text-sm text-zinc-500">
        {t("topbar.signedInAs")}{" "}
        <span className="font-medium text-zinc-900">{user.name}</span>
        {user.role === "ADMIN" ? (
          <span className="ml-2 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-700">
            {t("topbar.admin")}
          </span>
        ) : null}
        <span className="ml-2 hidden text-zinc-400 md:inline">{user.email}</span>
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
        >
          {t("topbar.signOut")}
        </button>
      </form>
    </header>
  );
}
