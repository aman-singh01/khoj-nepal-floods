import type { Person, Note } from "@/db/schema";
import { SITE_URL } from "./env";

/**
 * PFIF 1.4 (People Finder Interchange Format) export.
 *
 * PFIF is the lingua franca between missing-person trackers - the ICRC, Google's
 * historical Person Finder, national systems. Emitting it means our records can
 * be pulled into those systems instead of stranding families on one site.
 * Spec: https://zesty.ca/pfif/1.4/
 */

const PFIF_NS = "http://zesty.ca/pfif/1.4";
const DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

function xml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tag(name: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return `    <pfif:${name}>${xml(String(value))}</pfif:${name}>\n`;
}

function pfifStatus(s: Person["status"] | Note["statusReported"]): string | null {
  switch (s) {
    case "missing":
      return "believed_missing";
    case "seen_alive":
    case "safe":
    case "injured":
      return "believed_alive";
    case "deceased":
      return "believed_dead";
    default:
      return null;
  }
}

function splitName(full: string): { given: string; family: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { given: parts[0]!, family: "" };
  return { given: parts.slice(0, -1).join(" "), family: parts[parts.length - 1]! };
}

function personXml(p: Person, notes: Note[]): string {
  const { given, family } = splitName(p.fullName);
  const recordId = `${DOMAIN}/person.${p.id}`;
  const status = pfifStatus(p.status);

  let out = "  <pfif:person>\n";
  out += tag("person_record_id", recordId);
  out += tag("entry_date", p.createdAt.toISOString());
  out += tag("expiry_date", p.expiresAt.toISOString());
  out += tag("author_name", p.authorName);
  out += tag("source_name", "Khoj");
  out += tag("source_url", `${SITE_URL}/persons/${p.id}`);
  out += tag("source_date", p.createdAt.toISOString());
  out += tag("full_name", p.fullName);
  out += tag("given_name", given);
  out += tag("family_name", family);
  if (p.alsoKnownAs) out += tag("alternate_names", p.alsoKnownAs);
  if (p.sex !== "unknown") out += tag("sex", p.sex === "other" ? "other" : p.sex);
  if (p.ageYears != null) out += tag("age", p.ageYears);
  out += tag("home_city", p.homeLocation);
  out += tag("home_country", p.nationality);
  out += tag("photo_url", p.photoUrl);
  out += tag("description", p.description);

  // A synthetic note carries the current status and last-seen location.
  out += "    <pfif:note>\n";
  out += tag("note_record_id", `${DOMAIN}/note.${p.id}-headline`);
  out += tag("person_record_id", recordId);
  out += tag("entry_date", p.updatedAt.toISOString());
  out += tag("author_name", p.authorName);
  out += tag(
    "status",
    p.recordType === "seeking" && p.status === "missing"
      ? "information_sought"
      : status,
  );
  out += tag("last_known_location", p.lastSeenLocation);
  out += tag("text", p.description ?? `Record type: ${p.recordType}`);
  out += "    </pfif:note>\n";

  for (const n of notes) {
    out += "    <pfif:note>\n";
    out += tag("note_record_id", `${DOMAIN}/note.${n.id}`);
    out += tag("person_record_id", recordId);
    out += tag("entry_date", n.createdAt.toISOString());
    out += tag("author_name", n.authorName);
    out += tag("status", pfifStatus(n.statusReported));
    out += tag("last_known_location", n.lastKnownLocation);
    out += tag("text", n.text);
    out += "    </pfif:note>\n";
  }

  out += "  </pfif:person>\n";
  return out;
}

export function toPfifDocument(persons: Person[], notes: Note[]): string {
  const byPerson = new Map<string, Note[]>();
  for (const n of notes) {
    const list = byPerson.get(n.personId) ?? [];
    list.push(n);
    byPerson.set(n.personId, list);
  }

  let body = "";
  for (const p of persons) body += personXml(p, byPerson.get(p.id) ?? []);

  return `<?xml version="1.0" encoding="UTF-8"?>\n<pfif:pfif xmlns:pfif="${PFIF_NS}">\n${body}</pfif:pfif>\n`;
}
