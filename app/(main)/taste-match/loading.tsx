export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-muted" />
      <div className="mt-2 h-4 w-96 rounded bg-muted" />
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-border bg-card p-4">
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="mt-3 h-3 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}