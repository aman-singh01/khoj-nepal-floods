import Link from "next/link";
import type { PublicPerson } from "@/lib/repo";
import { StatusBadge } from "./StatusBadge";
import { personSummaryLine, relativeTime } from "@/lib/ui";

export function PersonCard({ person }: { person: PublicPerson }) {
  return (
    <Link
      href={`/persons/${person.id}`}
      className="flex gap-3 rounded-lg border border-border bg-surface p-3 transition hover:border-accent"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-border">
        {person.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.photoUrl}
            alt=""
            width={80}
            height={80}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl text-muted">
            {person.fullName.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold">{person.fullName}</h3>
          <StatusBadge status={person.status} />
        </div>
        {person.alsoKnownAs && (
          <p className="truncate text-sm text-muted">also “{person.alsoKnownAs}”</p>
        )}
        <p className="mt-0.5 line-clamp-2 text-sm text-muted">
          {personSummaryLine(person) || "No further details provided"}
        </p>
        <p className="mt-1 text-xs text-muted">
          {person.recordType === "seeking" ? "Being sought" : "Information posted"} ·
          updated {relativeTime(person.updatedAt)}
          {person.authorIsVerified && " · verified source"}
        </p>
      </div>
    </Link>
  );
}
