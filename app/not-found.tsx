import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-medium">404</h1>
      <p className="text-muted-foreground text-sm max-w-xs">
        This page doesn&apos;t exist in the den.
      </p>
      <Link href="/" className="text-sm underline">Back to home</Link>
    </div>
  );
}
