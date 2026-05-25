export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 animate-pulse">
      <div className="h-8 w-56 rounded bg-muted" />
      <div className="mt-2 h-4 w-80 rounded bg-muted" />
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl border border-border bg-card p-4" />
        ))}
      </div>
    </div>
  );
}