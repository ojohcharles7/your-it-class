import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl">🧭</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-[var(--muted)]">
        The page you are looking for may have moved, or the link is incorrect.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className="btn">Back home</Link>
        <Link href="/courses" className="btn btn-primary">Browse courses</Link>
      </div>
    </div>
  );
}
