/**
 * OFFICIAL SOURCES REGISTRY
 * =========================
 *
 * Khoj is a volunteer board. It is not connected to any government system by
 * default. This file is where the operator wires in the authoritative portals,
 * helplines, and machine-readable feeds for a specific emergency, AFTER
 * confirming each value against an official notification.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  BEFORE LAUNCH, for every entry:
 *   1. Confirm the URL / number is the correct contact point FOR THIS EVENT
 *      (crisis control-room numbers change per emergency).
 *   2. Set `verified: true` and fill `verifiedOn` / `verifiedBy`.
 *   3. For `kind: "feed"`, set `enabled: true` and `url` to the real feed, and
 *      only after a data-sharing agreement / permission is in place.
 *
 *  Phone numbers are deliberately left `null`. Do not guess them. Copy them
 *  from the Ministry of External Affairs (India) / Ministry of Foreign Affairs
 *  (Nepal) / mission advisories for this event.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type SourceCountry = "np" | "in" | "intl";

export type SourceKind =
  | "portal" // a website people should visit / register on
  | "helpline" // a phone number / control room
  | "feed"; // a machine-readable list Khoj can ingest

export type FeedFormat = "pfif" | "csv" | "json";

export interface OfficialSource {
  id: string;
  name: string;
  /** The body that runs it. */
  authority: string;
  country: SourceCountry;
  kind: SourceKind;
  /** One line: what a family should use this for. */
  purpose: string;
  url: string | null;
  /** Copy from an official advisory. Never guess. */
  phone: string | null;

  // Feed-only fields
  feedFormat?: FeedFormat;
  /** Column/field mapping for csv/json feeds. See src/lib/feeds/. */
  feedMapping?: Record<string, string>;
  /** Feeds are OFF until the operator turns them on with a real URL. */
  enabled?: boolean;

  /** Provenance of the verification. */
  verified: boolean;
  verifiedOn?: string;
  verifiedBy?: string;
  notes?: string;
}

/**
 * Starting points. Institutional homepages only — every one still needs the
 * operator to confirm it is the right destination for this emergency and to
 * set `verified: true`.
 */
export const OFFICIAL_SOURCES: OfficialSource[] = [
  // ── Nepal ────────────────────────────────────────────────────────────────
  {
    id: "np-ndrrma-bipad",
    name: "BIPAD Portal (Nepal disaster portal)",
    authority: "National Disaster Risk Reduction & Management Authority (NDRRMA)",
    country: "np",
    kind: "portal",
    purpose:
      "National picture of the disaster: affected areas, relief camps, official situation reports.",
    url: "https://bipadportal.gov.np/",
    phone: null,
    verified: false,
    notes:
      "Confirm the live incident page and whether NDRRMA is publishing a people/registration feed for this event.",
  },
  {
    id: "np-moha",
    name: "Ministry of Home Affairs / National Emergency Operation Centre",
    authority: "Government of Nepal — Ministry of Home Affairs (MoHA / NEOC)",
    country: "np",
    kind: "portal",
    purpose: "Lead agency for disaster response and search-and-rescue coordination.",
    url: "https://moha.gov.np/",
    phone: null,
    verified: false,
    notes: "NEOC runs a 24/7 control room; get the current hotline from MoHA's advisory.",
  },
  {
    id: "np-police-missing",
    name: "Nepal Police",
    authority: "Nepal Police",
    country: "np",
    kind: "portal",
    purpose: "File and check missing-person reports; district police control rooms.",
    url: "https://nepalpolice.gov.np/",
    phone: null,
    verified: false,
  },
  {
    id: "np-mofa",
    name: "Ministry of Foreign Affairs, Nepal",
    authority: "Government of Nepal — Ministry of Foreign Affairs (MoFA)",
    country: "np",
    kind: "portal",
    purpose:
      "For foreign nationals in Nepal and Nepali citizens abroad: consular coordination, contact with missions.",
    url: "https://mofa.gov.np/",
    phone: null,
    verified: false,
  },
  {
    id: "np-nrcs-rfl",
    name: "Nepal Red Cross Society — Restoring Family Links",
    authority: "Nepal Red Cross Society (NRCS)",
    country: "np",
    kind: "portal",
    purpose:
      "Tracing and reconnecting family members separated by the disaster, in the ICRC network.",
    url: "https://nrcs.org/",
    phone: null,
    verified: false,
  },

  // ── India ────────────────────────────────────────────────────────────────
  {
    id: "in-mea-portal",
    name: "Ministry of External Affairs, India",
    authority: "Government of India — Ministry of External Affairs (MEA)",
    country: "in",
    kind: "portal",
    purpose:
      "Primary channel for Indian nationals affected abroad. Issues event-specific control-room numbers and advisories.",
    url: "https://www.mea.gov.in/",
    phone: null,
    verified: false,
    notes:
      "For a Nepal emergency, MEA and the Embassy of India, Kathmandu publish a dedicated 24x7 control-room number and email — put those here once announced.",
  },
  {
    id: "in-embassy-kathmandu",
    name: "Embassy of India, Kathmandu",
    authority: "Government of India — Ministry of External Affairs",
    country: "in",
    kind: "portal",
    purpose:
      "On-the-ground consular help for Indian nationals in Nepal: welfare checks, documents, evacuation coordination.",
    url: "https://www.indembkathmandu.gov.in/",
    phone: null,
    verified: false,
  },
  {
    id: "in-madad",
    name: "MADAD — Consular Services Portal",
    authority: "Government of India — Ministry of External Affairs",
    country: "in",
    kind: "portal",
    purpose:
      "Register a consular grievance (including tracing an Indian national abroad) and track it.",
    url: "https://madad.gov.in/",
    phone: null,
    verified: false,
  },
  {
    id: "in-ndma",
    name: "National Disaster Management Authority, India",
    authority: "Government of India — NDMA",
    country: "in",
    kind: "portal",
    purpose: "Disaster response information; coordinates NDRF deployments.",
    url: "https://www.ndma.gov.in/",
    phone: null,
    verified: false,
  },
  {
    id: "in-redcross",
    name: "Indian Red Cross Society — Restoring Family Links",
    authority: "Indian Red Cross Society (IRCS)",
    country: "in",
    kind: "portal",
    purpose: "Cross-border family tracing in the ICRC network.",
    url: "https://indianredcross.org/",
    phone: null,
    verified: false,
  },

  // ── International ────────────────────────────────────────────────────────
  {
    id: "intl-icrc-rfl",
    name: "ICRC Restoring Family Links",
    authority: "International Committee of the Red Cross",
    country: "intl",
    kind: "portal",
    purpose:
      "The global family-reunification network. Works with both national Red Cross societies.",
    url: "https://familylinks.icrc.org/",
    phone: null,
    verified: false,
  },
  {
    id: "intl-icrc-tracetheface",
    name: "ICRC Trace the Face",
    authority: "International Committee of the Red Cross",
    country: "intl",
    kind: "portal",
    purpose: "Photo-based tracing tool for people looking for missing relatives.",
    url: "https://tracetheface.icrc.org/",
    phone: null,
    verified: false,
  },
  {
    id: "intl-iom",
    name: "International Organization for Migration (IOM)",
    authority: "IOM — UN Migration",
    country: "intl",
    kind: "portal",
    purpose:
      "Support for migrants and third-country nationals caught in the emergency.",
    url: "https://www.iom.int/",
    phone: null,
    verified: false,
  },

  // ── Machine-readable feeds (OFF until configured) ────────────────────────
  {
    id: "feed-partner-pfif",
    name: "Partner agency PFIF feed",
    authority: "— configure —",
    country: "intl",
    kind: "feed",
    purpose:
      "Ingest a partner's verified records in PFIF 1.4 and merge them into Khoj.",
    url: null, // e.g. "https://partner.example.org/api/pfif"
    phone: null,
    feedFormat: "pfif",
    enabled: false,
    verified: false,
    notes:
      "Only enable after a written data-sharing agreement. Records ingested here are marked as a verified source.",
  },
  {
    id: "feed-relief-camp-csv",
    name: "Relief-camp roster (CSV)",
    authority: "— configure —",
    country: "np",
    kind: "feed",
    purpose:
      "Ingest a periodic CSV roster of people registered at official relief camps.",
    url: null, // e.g. "https://.../camp-roster.csv"
    phone: null,
    feedFormat: "csv",
    feedMapping: {
      fullName: "name",
      ageYears: "age",
      sex: "gender",
      nationality: "nationality",
      lastSeenLocation: "camp",
      status: "status", // must map to: safe | seen_alive | injured | ...
      externalId: "id",
    },
    enabled: false,
    verified: false,
  },
];

export function sourcesForCountry(nationality: string | null | undefined) {
  const cc = toCountryCode(nationality);
  return OFFICIAL_SOURCES.filter(
    (s) => s.kind !== "feed" && (s.country === "intl" || s.country === cc),
  );
}

export function sourceById(id: string): OfficialSource | undefined {
  return OFFICIAL_SOURCES.find((s) => s.id === id);
}

export function enabledFeeds(): OfficialSource[] {
  return OFFICIAL_SOURCES.filter(
    (s) => s.kind === "feed" && s.enabled && s.url,
  );
}

/** Very small nationality → ISO-ish country bucket for matching sources. */
export function toCountryCode(
  nationality: string | null | undefined,
): SourceCountry | null {
  if (!nationality) return null;
  const n = nationality.trim().toLowerCase();
  if (/(^|\b)(nepal|nepali|nepalese|np)(\b|$)/.test(n)) return "np";
  if (/(^|\b)(india|indian|bharat|in)(\b|$)/.test(n)) return "in";
  return null;
}
