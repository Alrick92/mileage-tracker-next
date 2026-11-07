/**
 * Every page in this segment is dynamic (per-user DB reads), so without a
 * loading boundary a tap on a nav item would appear to do nothing until the
 * server responds. This skeleton renders instantly instead.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="animate-fade-in space-y-6">
      <span className="sr-only">Loading…</span>
      <div className="space-y-2">
        <Bone className="h-7 w-40" />
        <Bone className="h-4 w-64 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
        <Bone className="h-20 md:h-24" />
        <Bone className="h-20 md:h-24" />
        <Bone className="col-span-2 h-20 sm:col-span-1 md:h-24" />
      </div>
      <div className="space-y-3">
        <Bone className="h-18" />
        <Bone className="h-18" />
        <Bone className="h-18" />
      </div>
    </div>
  );
}

function Bone({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl bg-zinc-200/70 ${className}`}
    />
  );
}
