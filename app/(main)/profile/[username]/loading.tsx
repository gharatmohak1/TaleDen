export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 animate-pulse">
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <div className="h-24 w-24 rounded-full bg-muted" />
        <div className="space-y-2 text-center md:text-left">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-3 w-56 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-card p-4">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-2 h-3 w-full rounded bg-muted" />
            <div className="mt-1 h-3 w-3/4 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
