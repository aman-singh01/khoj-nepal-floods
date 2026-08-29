import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 text-sm sm:grid-cols-3 sm:px-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-strong text-[11px] font-semibold text-accent-fg"
            >
              खो
            </span>
            <span className="font-display font-semibold">Khoj</span>
          </div>
          <p className="text-muted">
            A volunteer-run board for reconnecting families separated by the Nepal
            floods. Not an official government or Red Cross service.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-sm font-semibold">Official tracing</h2>
          <p className="text-muted">
            For formal help, contact the{" "}
            <a
              className="font-medium text-accent-strong underline underline-offset-2"
              href="https://familylinks.icrc.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              ICRC Restoring Family Links
            </a>{" "}
            programme or the Nepal Red Cross Society. In an emergency, call local
            authorities.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-sm font-semibold">On this site</h2>
          <ul className="flex flex-col gap-1.5 text-muted">
            <li>
              <Link href="/about" className="underline underline-offset-2 hover:text-text">
                About &amp; safety
              </Link>
            </li>
            <li>
              <Link
                href="/about#privacy"
                className="underline underline-offset-2 hover:text-text"
              >
                Privacy
              </Link>
            </li>
            <li>
              <a
                href="/api/pfif"
                className="underline underline-offset-2 hover:text-text"
              >
                Data export (PFIF)
              </a>
            </li>
            <li>
              <Link
                href="/moderation"
                className="underline underline-offset-2 hover:text-text"
              >
                Moderator sign-in
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
