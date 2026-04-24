import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";

import { Sidebar } from "./_components/Sidebar";
import { TopBar } from "./_components/TopBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser({ allowMustChange: true });
  const t = translator(user.locale);
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 md:flex-row">
      <Sidebar
        appTitle={t("app.title")}
        version={t("app.version")}
        labels={{
          dashboard: t("nav.dashboard"),
          vehicles: t("nav.vehicles"),
          trips: t("nav.trips"),
          reports: t("nav.reports"),
          settings: t("nav.settings"),
          admin: t("nav.admin"),
          fleet: t("nav.fleet"),
          audit: t("nav.audit"),
        }}
        isAdmin={user.role === "ADMIN"}
      />
      <div className="flex flex-1 flex-col">
        <TopBar user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
