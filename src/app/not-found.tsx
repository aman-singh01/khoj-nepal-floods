import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="font-display text-3xl font-semibold">Not found</h1>
      <p className="text-muted">
        This record may have been removed, or the link is incorrect.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <Link href="/persons" className="btn-primary">
          Search records
        </Link>
        <Link href="/" className="btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}
