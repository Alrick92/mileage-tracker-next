import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/i18n";

import { MobileHeader, MobileTabBar } from "./_components/MobileNav";
import { Sidebar } from "./_components/Sidebar";
import { TopBar } from "./_components/TopBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser({ allowMustChange: true });
  const t = translator(user.locale);
  const isAdmin = user.role === "ADMIN";

  const navLabels = {
    dashboard: t("nav.dashboard"),
    vehicles: t("nav.vehicles"),
    trips: t("nav.trips"),
    settings: t("nav.settings"),
    admin: t("nav.admin"),
    fleet: t("nav.fleet"),
    audit: t("nav.audit"),
  };
  const mobileUser = { name: user.name, email: user.email, isAdmin };

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 md:flex-row">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("nav.skipToContent")}
      </a>
      <Sidebar
        appTitle={t("app.title")}
        version={t("app.version")}
        labels={navLabels}
        logTripLabel={t("trips.logTrip")}
        adminHeading={t("nav.adminHeading")}
        isAdmin={isAdmin}
      />
      <MobileHeader
        appTitle={t("app.title")}
        user={mobileUser}
        settingsLabel={t("nav.settings")}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 px-4 pt-5 pb-8 outline-none sm:px-6 md:px-10 md:pt-8 md:pb-12"
        >
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <MobileTabBar
          user={mobileUser}
          labels={{
            ...navLabels,
            mainNav: t("nav.main"),
            logTrip: t("nav.logShort"),
            more: t("nav.more"),
            close: t("common.close"),
            adminHeading: t("nav.adminHeading"),
            importCsv: t("trips.importCsv"),
            exportCsv: t("trips.exportCsv"),
            signOut: t("topbar.signOut"),
            adminBadge: t("topbar.admin"),
          }}
        />
      </div>
    </div>
  );
}
