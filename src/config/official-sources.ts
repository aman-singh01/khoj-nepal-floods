/**
 * OFFICIAL SOURCES REGISTRY
 * =========================
 *
 * The portals and helplines for the current emergency. Entries marked
 * `verified: true` were checked against the source in `verifiedBy` on
 * `verifiedOn`. Re-check before a public launch — crisis control rooms move and
 * close.
 *
 *  Sources used (2026-08-29):
 *   - Nepal MoFA notice, Emergency Control Room:
 *     https://mofa.gov.np/content/1862/notice--emergency-response-team-for-assistance-regarding/
 *     https://mofa.gov.np/category/flashflood/
 *   - MEA (India) "Special Control Room for Nepal Floods Situation", reported
 *     from the official MEA statement (Telangana Today, Oneindia, The Federal,
 *     Deccan Chronicle, 27 Aug 2026).
 *   - Nepal national disaster hotline 1234 / Nepal Police 100: multiple reports
 *     (Everest Holiday helplines round-up; general reporting).
 *   - Event facts: en.wikipedia.org/wiki/2026_Nepal_floods; NPR; CBS; Euronews.
 */

export type SourceCountry = "np" | "in" | "us" | "intl";

export type SourceKind = "portal" | "helpline" | "feed";
export type FeedFormat = "pfif" | "csv" | "json";

/** Verified facts about the emergency this instance is responding to. */
export const EVENT = {
  name: "Bhotekoshi–Trishuli glacial flash flood",
  date: "26 August 2026",
  summary:
    "A glacier collapse near Langtang Lirung sent a flash flood 72 km down the Bhotekoshi/Trishuli river through Rasuwa, Nuwakot and downstream districts of Nepal, and into Gyirong County, Tibet. Hundreds are dead and thousands are missing, more than half of them foreign nationals (Indian, American, Ukrainian, Malaysian, Australian, British, Canadian, Chinese and South Korean among them).",
  officialUpdates: "https://mofa.gov.np/category/flashflood/",
  updatedOn: "2026-08-29",
} as const;

export interface OfficialSource {
  id: string;
  name: string;
  authority: string;
  country: SourceCountry;
  kind: SourceKind;
  purpose: string;
  url: string | null;
  /** Free text so we can list several numbers / WhatsApp / hours together. */
  phone: string | null;
  email?: string | null;

  feedFormat?: FeedFormat;
  feedMapping?: Record<string, string>;
  enabled?: boolean;

  verified: boolean;
  verifiedOn?: string;
  verifiedBy?: string;
  notes?: string;
}

export const OFFICIAL_SOURCES: OfficialSource[] = [
  // ── Nepal ────────────────────────────────────────────────────────────────
  {
    id: "np-mofa-ecr",
    name: "Ministry of Foreign Affairs — Emergency Control Room",
    authority: "Government of Nepal — Ministry of Foreign Affairs",
    country: "np",
    kind: "helpline",
    purpose:
      "The central point for FOREIGN NATIONALS affected by or missing in this flood — search, rescue, information verification and consular assistance. Families and the public are asked to contact it directly.",
    url: "https://mofa.gov.np/category/flashflood/",
    phone: "+977 974 444 1227, +977 974 444 1228 (call / WhatsApp, 7am–10pm NPT)",
    email: "emergency@mofa.gov.np",
    verified: true,
    verifiedOn: "2026-08-29",
    verifiedBy: "mofa.gov.np official notice (content/1862)",
  },
  {
    id: "np-neoc-1234",
    name: "National disaster hotline — 1234",
    authority: "Government of Nepal — Ministry of Home Affairs / NEOC",
    country: "np",
    kind: "helpline",
    purpose:
      "Dial 1234 from anywhere in Nepal to reach the National / District Emergency Operation Centre. (Replaced the old 1149 in July 2026.)",
    url: "https://moha.gov.np/",
    phone: "1234 (within Nepal)",
    verified: true,
    verifiedOn: "2026-08-29",
    verifiedBy: "multiple reports (helpline round-ups, general coverage)",
  },
  {
    id: "np-police-100",
    name: "Nepal Police — 100",
    authority: "Nepal Police",
    country: "np",
    kind: "helpline",
    purpose:
      "Call 100 to file a missing-person report and have someone recorded as missing. Missing / deceased records are also published on the Nepal Police site.",
    url: "https://nepalpolice.gov.np/",
    phone: "100 (within Nepal); Tourist Police 1144",
    verified: true,
    verifiedOn: "2026-08-29",
    verifiedBy: "multiple reports",
  },
  {
    id: "np-bipad",
    name: "BIPAD Portal — disaster incident data",
    authority: "National Disaster Risk Reduction & Management Authority (NDRRMA)",
    country: "np",
    kind: "portal",
    purpose:
      "Official incident data: affected areas, relief camps, casualty and missing figures, situation reports.",
    url: "https://bipadportal.gov.np/",
    phone: null,
    verified: true,
    verifiedOn: "2026-08-29",
    verifiedBy: "reachable; operated by NDRRMA",
  },
  {
    id: "np-ndrrma",
    name: "NDRRMA",
    authority: "National Disaster Risk Reduction & Management Authority",
    country: "np",
    kind: "portal",
    purpose:
      "Lead authority coordinating search, rescue and relief operations. Live incident data is on the BIPAD portal and @NDRRMA_Nepal on X.",
    url: "https://ndrrma.gov.np/en",
    phone: "+977 1 5358240 (general office, Baber Mahal, Kathmandu)",
    verified: true,
    verifiedOn: "2026-08-29",
    verifiedBy:
      "domain corroborated across PreventionWeb / UN-SPIDER / Devex; office number from secondary reporting",
  },
  {
    id: "np-ntb",
    name: "Nepal Tourism Board — missing foreign visitors registry",
    authority: "Nepal Tourism Board",
    country: "np",
    kind: "helpline",
    purpose:
      "Reported to be maintaining a registry of foreign nationals (trekkers, Kailash pilgrims) missing in the flood.",
    url: "https://ntb.gov.np/",
    phone: "+977 1 4256909 (NTB Kathmandu office — not confirmed as a tracing desk)",
    verified: false,
    verifiedOn: "2026-08-29",
    verifiedBy:
      "NTB is compiling a list of out-of-contact foreign visitors (517 foreign nationals reported), but has not published a dedicated public helpline",
  },
  {
    id: "np-nrcs",
    name: "Nepal Red Cross Society — Restoring Family Links",
    authority: "Nepal Red Cross Society (NRCS)",
    country: "np",
    kind: "portal",
    purpose:
      "Tracing and reconnecting separated family members, in the ICRC network. NRCS has activated its Emergency Operations Centre for this flood.",
    url: "https://familylinks.icrc.org/organization/nepal-red-cross-society",
    phone: null,
    verified: true,
    verifiedOn: "2026-08-29",
    verifiedBy:
      "nrcs.org confirmed; NRCS EOC activation reported (redcross.org, Aug 2026); ICRC RFL org page for NRCS exists",
  },

  // ── India (288 nationals reported missing — largest foreign group) ───────
  {
    id: "in-mea-control-room",
    name: "MEA Special Control Room (New Delhi)",
    authority: "Government of India — Ministry of External Affairs",
    country: "in",
    kind: "helpline",
    purpose:
      "24×7 control room for Indian nationals affected by the Nepal floods and their families.",
    url: "https://www.mea.gov.in/",
    phone: "+91 11 2308 8718, +91 11 2308 8719; WhatsApp +91 99682 91988",
    email: "situationroom@mea.gov.in",
    verified: true,
    verifiedOn: "2026-08-29",
    verifiedBy: "official MEA statement, 27 Aug 2026 (multiple outlets)",
  },
  {
    id: "in-embassy-kathmandu",
    name: "Embassy of India, Kathmandu — 24×7 helpline",
    authority: "Government of India — Ministry of External Affairs",
    country: "in",
    kind: "helpline",
    purpose:
      "On-the-ground consular help for Indian nationals in Nepal: welfare checks, documents, evacuation coordination.",
    url: "https://www.indembkathmandu.gov.in/",
    phone:
      "+977 985 131 6807, +977 970 910 7500, +977 981 032 6117 (call / WhatsApp)",
    verified: true,
    verifiedOn: "2026-08-29",
    verifiedBy: "official MEA statement, 27 Aug 2026 (multiple outlets)",
  },
  {
    id: "in-madad",
    name: "MADAD — Consular Services Portal",
    authority: "Government of India — Ministry of External Affairs",
    country: "in",
    kind: "portal",
    purpose:
      "Register a consular grievance, including tracing an Indian national abroad, and track it online.",
    url: "https://madad.gov.in/",
    phone: null,
    verified: false,
    notes:
      "madad.gov.in did not respond when checked (2026-08-29) — confirm MEA's current consular grievance portal. Use the MEA control room above meanwhile. Several Indian states (e.g. Haryana / Gurugram) also opened district desks.",
  },
  {
    id: "in-ndma",
    name: "National Disaster Management Authority, India",
    authority: "Government of India — NDMA",
    country: "in",
    kind: "portal",
    purpose: "Indian disaster-response coordination; deployed NDRF assistance to Nepal.",
    url: "https://www.ndma.gov.in/",
    phone: null,
    verified: true,
    verifiedOn: "2026-08-29",
    verifiedBy: "ndma.gov.in reachable; NDRF assistance to Nepal reported",
  },

  // ── United States (≈90 nationals reported missing) ──────────────────────
  {
    id: "us-embassy-nepal",
    name: "U.S. Embassy in Nepal / travel.state.gov",
    authority: "U.S. Department of State",
    country: "us",
    kind: "portal",
    purpose:
      "For U.S. citizens in Nepal and their families. State Dept is working with Nepali authorities and has deployed a disaster response advisor.",
    url: "https://np.usembassy.gov/",
    phone:
      "State Dept Overseas Citizens Services: +1 888 407 4747 (US/Canada) / +1 202 501 4444 (overseas). Family tracing — American Red Cross: +1 844 782 9441",
    verified: true,
    verifiedOn: "2026-08-29",
    verifiedBy:
      "np.usembassy.gov reachable; State Dept engaged (adviser deployed, working with local authorities per reporting); ACS line is the standing channel — no flood-specific task-force number published. ARC RFL helpline confirmed on redcross.org.",
  },

  // ── International / any nationality ─────────────────────────────────────
  {
    id: "intl-mofa-ecr",
    name: "Nepal MoFA Emergency Control Room (all nationalities)",
    authority: "Government of Nepal — Ministry of Foreign Affairs",
    country: "intl",
    kind: "helpline",
    purpose:
      "Nepal's control room is for foreign nationals of ANY country. If your country has no listing here, contact it, plus your embassy in Kathmandu.",
    url: "https://mofa.gov.np/category/flashflood/",
    phone: "+977 974 444 1227, +977 974 444 1228 (call / WhatsApp, 7am–10pm NPT)",
    email: "emergency@mofa.gov.np",
    verified: true,
    verifiedOn: "2026-08-29",
    verifiedBy: "mofa.gov.np official notice (content/1862)",
  },
  {
    id: "intl-icrc-rfl",
    name: "ICRC Restoring Family Links",
    authority: "International Committee of the Red Cross",
    country: "intl",
    kind: "portal",
    purpose:
      "The global family-reunification network, working through the Nepal Red Cross and other national societies. Start a search through your own national Red Cross.",
    url: "https://familylinks.icrc.org/",
    phone: "Families abroad — American Red Cross RFL helpline: +1 844 782 9441",
    verified: true,
    verifiedOn: "2026-08-29",
    verifiedBy:
      "familylinks.icrc.org is the RFL network (org pages for Nepal Red Cross and American Red Cross exist); ARC helpline confirmed on redcross.org",
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
    notes:
      "Long-running ICRC tool; the site did not respond when checked (2026-08-29). If unavailable, use familylinks.icrc.org or your national Red Cross society.",
  },

  // ── Machine-readable feeds ─────────────────────────────────────────────
  {
    id: "sodhera-flood",
    name: "flood.sodhera.com — community registry",
    authority: "Sodhera Intelligence Pvt. Ltd. (community project, not official)",
    country: "np",
    kind: "feed",
    purpose:
      "A peer volunteer registry for this flood. Its records are community-reported and mostly unverified; Khoj imports them as such and attributes them.",
    url: "https://flood.sodhera.com/api/export",
    phone: null,
    feedFormat: "csv",
    feedMapping: {
      externalId: "Case number",
      recordType: "Report type",
      fullName: "Name",
      sex: "Gender",
      ageYears: "Approximate age",
      lastSeenLocation: "Broad place",
      lastSeenAt: "Event date",
      description: "Identifying details",
      status: "Status",
      unverified: "Unverified",
    },
    enabled: true,
    verified: false,
    verifiedOn: "2026-08-29",
    verifiedBy:
      "public /api/export, no stated terms; one-way import pending a two-way sync (docs/outreach-sodhera.md)",
    notes:
      "Imported records: marked unverified, shown 'via flood.sodhera.com', phone numbers stripped from text, removed rows skipped, excluded from Khoj's own PFIF export.",
  },
  {
    id: "feed-partner-pfif",
    name: "Partner agency PFIF feed",
    authority: "— configure —",
    country: "intl",
    kind: "feed",
    purpose: "Ingest a partner's verified records in PFIF 1.4 and merge them into Khoj.",
    url: null,
    phone: null,
    feedFormat: "pfif",
    enabled: false,
    verified: false,
    notes: "Only enable after a written data-sharing agreement.",
  },
  {
    id: "feed-relief-camp-csv",
    name: "Relief-camp roster (CSV)",
    authority: "— configure —",
    country: "np",
    kind: "feed",
    purpose: "Ingest a periodic CSV roster of people registered at official relief camps.",
    url: null,
    phone: null,
    feedFormat: "csv",
    feedMapping: {
      fullName: "name",
      ageYears: "age",
      sex: "gender",
      nationality: "nationality",
      lastSeenLocation: "camp",
      status: "status",
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
  return OFFICIAL_SOURCES.filter((s) => s.kind === "feed" && s.enabled && s.url);
}

/** Small nationality → country bucket for matching sources. */
export function toCountryCode(
  nationality: string | null | undefined,
): SourceCountry | null {
  if (!nationality) return null;
  const n = nationality.trim().toLowerCase();
  if (/\b(nepal|nepali|nepalese|np)\b/.test(n)) return "np";
  if (/\b(india|indian|bharat|in)\b/.test(n)) return "in";
  if (/\b(usa|u\.s\.a?|united states|america|american|us)\b/.test(n)) return "us";
  return null;
}
