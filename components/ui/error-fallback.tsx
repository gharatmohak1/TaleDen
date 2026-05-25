export default function ErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm text-muted-foreground max-w-sm">
        {error.message ?? "Something went wrong."}
      </p>
      <button onClick={reset} className="text-sm underline">
        Try again
      </button>
    </div>
  );
}
