export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 animate-pulse">
      <div className="h-4 w-24 rounded bg-muted mb-6" />
      <div className="relative -mx-4 h-48 sm:-mx-6 sm:h-64 md:h-80 bg-muted" />
      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <div className="mx-auto h-72 w-48 shrink-0 rounded-xl bg-muted md:mx-0" />
        <div className="flex-1 space-y-4">
          <div className="h-8 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 w-16 rounded-full bg-muted" />
            ))}
          </div>
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-4 w-1/4 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-10 space-y-3">
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
      </div>
    </div>
  );
}
