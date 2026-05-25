export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-muted" />
      <div className="mt-6 aspect-video w-full rounded-xl bg-muted" />
      <div className="mt-6 flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 w-12 rounded-full bg-muted" />
        ))}
      </div>
      <div className="mt-8 space-y-3">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
      </div>
    </div>
  );
}
