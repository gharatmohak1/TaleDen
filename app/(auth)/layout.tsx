export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">TaleDen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every film has a story. Every viewer has a fingerprint.
        </p>
      </div>
      {children}
    </div>
  );
}
