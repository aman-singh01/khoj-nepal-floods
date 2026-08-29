import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-12 text-center">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="text-muted">
        This record may have been removed, or the link is incorrect.
      </p>
      <div className="flex justify-center gap-3">
        <Link
          href="/persons"
          className="rounded-md bg-accent px-4 py-2 font-medium text-accent-fg"
        >
          Search records
        </Link>
        <Link href="/" className="rounded-md border border-border px-4 py-2">
          Home
        </Link>
      </div>
    </div>
  );
}
