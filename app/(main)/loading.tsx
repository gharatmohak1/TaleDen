export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 animate-pulse">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-8 md:p-12">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="mt-4 h-8 w-3/4 rounded bg-muted" />
        <div className="mt-4 h-4 w-1/2 rounded bg-muted" />
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl border border-border bg-card p-6">
            <div className="h-8 w-8 rounded bg-muted" />
            <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
            <div className="mt-2 h-3 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}