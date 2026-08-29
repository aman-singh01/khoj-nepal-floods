import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-fg text-sm"
          >
            खो
          </span>
          <span>Khoj</span>
          <span className="hidden text-sm font-normal text-muted sm:inline">
            Nepal floods — find missing people
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/persons" className="hover:underline">
            Search
          </Link>
          <Link
            href="/report"
            className="rounded-md bg-accent px-3 py-1.5 font-medium text-accent-fg hover:opacity-90"
          >
            Report someone
          </Link>
          <Link href="/about" className="hover:underline">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
