export default function MainLoading() {
  return (
    <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
