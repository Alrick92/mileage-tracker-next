import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { translator } from "@/lib/i18n";
import { Toast } from "@/app/(app)/_components/Toast";

import {
  adminAssignUserAction,
  adminUnassignUserAction,
} from "./actions";

export const metadata = {
  title: "Vehicle assignments · Mileage Tracker",
};

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{
  assigned?: string;
  unassigned?: string;
  error?: string;
}>;

export default async function AdminVehicleAssignmentsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const admin = await requireAdmin();
  const t = translator(admin.locale);
  const { id } = await params;
  const { assigned, unassigned, error } = await searchParams;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!vehicle) notFound();

  const assignedUserIds = new Set(
    vehicle.assignments.map((a) => a.user.id),
  );

  const unassignedUsers = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(assignedUserIds) },
    },
    select: { id: true, name: true, email: true, enabled: true },
    orderBy: [{ enabled: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/fleet"
        className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
      >
        ← {t("admin.fleet.title")}
      </Link>

      {assigned ? (
        <Toast variant="success" message={t("admin.assignments.toast.assigned")} />
      ) : null}
      {unassigned ? (
        <Toast
          variant="success"
          message={t("admin.assignments.toast.unassigned")}
        />
      ) : null}
      {error ? <Toast variant="error" message={error} /> : null}

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("admin.assignments.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t("admin.assignments.subtitle")}
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <dl className="space-y-1 rounded-lg bg-zinc-50 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500">
              {t("dashboard.col.vehicle")}
            </dt>
            <dd className="font-medium text-zinc-900">{vehicle.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500">{t("dashboard.col.plate")}</dt>
            <dd className="font-mono text-xs text-zinc-900">
              {vehicle.licensePlate ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {t("admin.assignments.assignedHeading")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {t("admin.assignments.assignedSubtitle")}
        </p>
        {vehicle.assignments.length === 0 ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t("admin.assignments.none")}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100">
            {vehicle.assignments.map((a) => {
              const isOnlyOne = vehicle.assignments.length === 1;
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <div className="text-sm font-medium text-zinc-900">
                      {a.user.name}
                    </div>
                    <div className="font-mono text-xs text-zinc-500">
                      {a.user.email}
                    </div>
                  </div>
                  <form action={adminUnassignUserAction}>
                    <input type="hidden" name="vehicleId" value={vehicle.id} />
                    <input type="hidden" name="userId" value={a.user.id} />
                    <button
                      type="submit"
                      disabled={isOnlyOne}
                      title={
                        isOnlyOne
                          ? t("admin.assignments.cannotRemoveLast")
                          : undefined
                      }
                      className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t("admin.assignments.remove")}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {t("admin.assignments.addHeading")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {t("admin.assignments.addSubtitle")}
        </p>
        {unassignedUsers.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            {t("admin.assignments.allAssigned")}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100">
            {unassignedUsers.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-zinc-900">
                    {u.name}
                    {!u.enabled ? (
                      <span className="ml-2 inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-800">
                        {t("admin.assignments.disabled")}
                      </span>
                    ) : null}
                  </div>
                  <div className="font-mono text-xs text-zinc-500">
                    {u.email}
                  </div>
                </div>
                <form action={adminAssignUserAction}>
                  <input type="hidden" name="vehicleId" value={vehicle.id} />
                  <input type="hidden" name="userId" value={u.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    {t("admin.assignments.assign")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
