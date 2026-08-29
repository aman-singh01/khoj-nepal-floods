import type { Metadata } from "next";

export const metadata: Metadata = { title: "About & safety" };

export default function AboutPage() {
  return (
    <div className="prose-sm mx-auto max-w-2xl space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">About Khoj</h1>
        <p>
          Khoj (&ldquo;search&rdquo;) is a volunteer-run message board for
          reconnecting people separated by the Nepal floods. Anyone can post a
          record for a missing person, add a sighting, or search what others have
          shared. It follows the data model of Google&rsquo;s Person Finder and
          exports the{" "}
          <a className="underline" href="https://zesty.ca/pfif/1.4/">
            PFIF
          </a>{" "}
          standard so records can be shared with official tracing services.
        </p>
        <p className="font-medium">
          This is not an official service. For formal tracing, work with the{" "}
          <a
            className="underline"
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
        <h2 className="text-xl font-semibold">Staying safe</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Never pay anyone</strong> who claims to be holding a relative.
            No genuine responder charges a fee.
          </li>
          <li>
            Contact details you enter are <strong>never shown publicly</strong>.
            Messages between people are relayed by moderators.
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

      <section id="privacy" className="space-y-3">
        <h2 className="text-xl font-semibold">Privacy</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Public fields: name, approximate age, sex, nationality, locations,
            description, photo, and status. These are visible to everyone and
            indexed by search engines.
          </li>
          <li>
            Private fields: the submitter&rsquo;s name detail, email, and phone.
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
