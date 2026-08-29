import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-strong text-[13px] font-semibold text-accent-fg shadow-sm"
          >
            खो
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-tight">
              Khoj
            </span>
            <span className="hidden text-[11px] text-muted sm:block">
              Nepal floods · find missing people
            </span>
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/persons"
            className="rounded-lg px-3 py-1.5 font-medium text-muted transition hover:bg-surface-2 hover:text-text"
          >
            Search
          </Link>
          <Link href="/report" className="btn-primary px-3.5 py-2 text-sm">
            Report someone
          </Link>
          <Link
            href="/about"
            className="rounded-lg px-3 py-1.5 font-medium text-muted transition hover:bg-surface-2 hover:text-text"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
