import { requireUser } from "@/lib/auth";

import { Sidebar } from "./_components/Sidebar";
import { TopBar } from "./_components/TopBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar user={user} />
        <main className="flex-1 px-6 py-8 md:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
