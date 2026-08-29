import Link from "next/link";
import type { CSSProperties } from "react";
import type { PublicPerson } from "@/lib/repo";
import { StatusBadge } from "./StatusBadge";
import { avatarHue, personSummaryLine, relativeTime } from "@/lib/ui";

export function PersonCard({ person }: { person: PublicPerson }) {
  return (
    <Link
      href={`/persons/${person.id}`}
      className="group flex gap-3.5 rounded-2xl border border-border bg-surface p-3.5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
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
          <span
            className="avatar flex h-full w-full items-center justify-center font-display text-2xl font-semibold"
            style={{ "--av-h": avatarHue(person.fullName) } as CSSProperties}
            aria-hidden
          >
            {person.fullName.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="truncate font-display text-base font-semibold">
            {person.fullName}
          </h3>
          <StatusBadge status={person.status} />
        </div>
        {person.alsoKnownAs && (
          <p className="truncate text-sm text-muted">also “{person.alsoKnownAs}”</p>
        )}
        <p className="mt-0.5 line-clamp-2 text-sm text-muted">
          {personSummaryLine(person) || "No further details provided"}
        </p>
        <p className="mt-1.5 text-xs text-muted">
          {person.recordType === "seeking" ? "Being sought" : "Information posted"}
          {" · updated "}
          {relativeTime(person.updatedAt)}
          {person.importedFrom
            ? ` · via ${person.importedFrom}`
            : person.authorIsVerified && " · verified source"}
        </p>
      </div>
    </Link>
  );
}
