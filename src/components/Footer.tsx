import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted">
        <p className="mb-3">
          <strong className="text-text">Khoj</strong> is a volunteer-run board for
          reconnecting families separated by the Nepal floods. It is not an
          official government or Red Cross service.
        </p>
        <p className="mb-3">
          For official tracing, contact the{" "}
          <a
            className="underline"
            href="https://familylinks.icrc.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            ICRC Restoring Family Links
          </a>{" "}
          programme or the Nepal Red Cross Society. In an emergency, call local
          authorities.
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/about" className="underline">
            About &amp; safety
          </Link>
          <Link href="/about#privacy" className="underline">
            Privacy
          </Link>
          <a href="/api/pfif" className="underline">
            Data export (PFIF)
          </a>
          <Link href="/moderation" className="underline">
            Moderator sign-in
          </Link>
        </p>
      </div>
    </footer>
  );
}
