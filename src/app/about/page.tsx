import type { Metadata } from "next";

export const metadata: Metadata = { title: "About & safety" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <section className="space-y-3">
        <h1 className="font-display text-2xl font-semibold">About Khoj</h1>
        <p className="leading-relaxed text-muted">
          Khoj (&ldquo;search&rdquo;) is a volunteer-run message board for
          reconnecting people separated by the Nepal floods. Anyone can post a
          record for a missing person, add a sighting, or search what others have
          shared. It follows the data model of Google&rsquo;s Person Finder and
          exports the{" "}
          <a
            className="text-accent-strong underline underline-offset-2"
            href="https://zesty.ca/pfif/1.4/"
          >
            PFIF
          </a>{" "}
          standard so records can be shared with official tracing services.
        </p>
        <p className="rounded-xl border border-border bg-surface p-4 text-sm font-medium shadow-sm">
          This is not an official service. For formal tracing, work with the{" "}
          <a
            className="text-accent-strong underline underline-offset-2"
            href="https://familylinks.icrc.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            ICRC Restoring Family Links
          </a>{" "}
          programme and the Nepal Red Cross Society.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Staying safe</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted marker:text-accent">
          <li>
            <strong className="text-text">Never pay anyone</strong> who claims to
            be holding a relative. No genuine responder charges a fee.
          </li>
          <li>
            Contact details you enter are{" "}
            <strong className="text-text">never shown publicly</strong>. Messages
            between people are relayed by moderators.
          </li>
          <li>
            Don&rsquo;t post home addresses, passport or ID numbers, or bank
            details — for anyone.
          </li>
          <li>
            Records for children should only be created by a parent, guardian, or
            a recognised responder.
          </li>
          <li>
            Use the &ldquo;Report this record&rdquo; link on any record that looks
            like a scam, is fake, or raises a privacy concern.
          </li>
        </ul>
      </section>

      <section id="privacy" className="space-y-3 scroll-mt-20">
        <h2 className="font-display text-xl font-semibold">Privacy</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted marker:text-accent">
          <li>
            Public fields: name, approximate age, sex, nationality, locations,
            description, photo, and status. These are visible to everyone and
            indexed by search engines.
          </li>
          <li>
            Private fields: the submitter&rsquo;s contact name, email, and phone.
            These are visible only to moderators.
          </li>
          <li>
            We store a one-way hash of submitter IP addresses (never the address
            itself) to limit spam and abuse.
          </li>
          <li>
            Records expire automatically after a set period (default 180 days) and
            can be removed on request at any time.
          </li>
          <li>
            Anyone can request removal of a record about them or their family by
            contacting the moderators.
          </li>
        </ul>
      </section>
    </div>
  );
}
