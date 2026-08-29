import { describe, it, expect } from "vitest";
import { parsePfif } from "./pfif";
import { parseCsv, csvToRecords } from "./csv";
import { ingestPayload } from "./index";
import { toPfifDocument } from "@/lib/pfif";
import {
  searchPersons,
  getPersonPublic,
  allPublicForExport,
  upsertImported,
} from "@/lib/repo";
import {
  OFFICIAL_SOURCES,
  sourcesForCountry,
  toCountryCode,
  enabledFeeds,
} from "@/config/official-sources";
import type { Person } from "@/db/schema";

function person(over: Partial<Person> = {}): Person {
  const now = new Date("2026-08-20T10:00:00Z");
  return {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    recordType: "seeking",
    fullName: "Sita Gurung",
    nameNormalized: "sita gurung",
    alsoKnownAs: null,
    ageYears: 40,
    ageIsApprox: false,
    sex: "female",
    nationality: "Nepal",
    homeLocation: "Bahrabise",
    lastSeenLocation: "Bahrabise market",
    lastSeenAt: null,
    description: "Grey shawl",
    photoUrl: null,
    status: "missing",
    authorName: "Ram",
    authorRelation: "son",
    authorEmail: null,
    authorPhone: null,
    authorIsVerified: false,
    editToken: "t",
    source: "web",
    pfifRecordId: null,
    linkedPersonId: null,
    moderationState: "published",
    reportCount: 0,
    submitterIpHash: null,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date("2027-01-01T00:00:00Z"),
    ...over,
  };
}

describe("PFIF round-trip", () => {
  it("parses back what toPfifDocument emits", () => {
    const xml = toPfifDocument([person()], []);
    const recs = parsePfif(xml);
    expect(recs).toHaveLength(1);
    expect(recs[0].fullName).toBe("Sita Gurung");
    expect(recs[0].nationality).toBe("Nepal");
    expect(recs[0].ageYears).toBe(40);
    expect(recs[0].recordType).toBe("seeking");
    expect(recs[0].status).toBe("missing");
  });

  it("maps believed_dead to deceased/info", () => {
    const xml = toPfifDocument(
      [person({ recordType: "info", status: "deceased" })],
      [],
    );
    const recs = parsePfif(xml);
    expect(recs[0].status).toBe("deceased");
    expect(recs[0].recordType).toBe("info");
  });
});

describe("CSV", () => {
  it("handles quoted fields with commas and newlines", () => {
    const rows = parseCsv('a,b\n"x, y","line1\nline2"\n');
    expect(rows).toEqual([
      ["a", "b"],
      ["x, y", "line1\nline2"],
    ]);
  });

  it("maps rows to records via a column mapping", () => {
    const csv = "name,age,camp,id\nAsha Rai,12,Chautara,R-1\n";
    const recs = csvToRecords(csv, {
      fullName: "name",
      ageYears: "age",
      lastSeenLocation: "camp",
      externalId: "id",
    });
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({
      fullName: "Asha Rai",
      ageYears: 12,
      lastSeenLocation: "Chautara",
      externalId: "R-1",
      recordType: "info",
      status: "safe",
    });
  });
});

describe("ingestPayload", () => {
  const xml = toPfifDocument(
    [
      person({
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        fullName: "Imported Person",
        nationality: "India",
      }),
    ],
    [],
  );

  it("imports a PFIF record and marks it verified + attributed to the source", async () => {
    const r1 = await ingestPayload("np-nrcs", xml, "pfif");
    expect(r1.imported).toBe(1);
    expect(r1.updated).toBe(0);

    const hits = await searchPersons({ q: "Imported Person" });
    const hit = hits.find((p) => p.fullName === "Imported Person");
    expect(hit).toBeTruthy();
    expect(hit!.authorIsVerified).toBe(true);
    expect(hit!.importedFrom).toMatch(/Red Cross/);

    const full = await getPersonPublic(hit!.id);
    expect(full?.person.nationality).toBe("India");
  });

  it("is idempotent - a second run updates in place", async () => {
    const r2 = await ingestPayload("np-nrcs", xml, "pfif");
    expect(r2.imported).toBe(0);
    expect(r2.updated).toBe(1);

    const hits = await searchPersons({ q: "Imported Person" });
    expect(
      hits.filter((p) => p.fullName === "Imported Person"),
    ).toHaveLength(1);
  });
});

// A slice of flood.sodhera.com's /api/export format.
const SODHERA_CSV =
  '"Case number","Report type","Name","Gender","Approximate age","Broad place","Event date","Identifying details","Status","Unverified"\n' +
  '"RF-2026-000148","missing","Rajesh Syangtan","male","47","Rasuwa","2026-08-26T08:25:00+00:00","Tattoo on hand. Contact: 9863267631. Family contacts: 9848944392","active","true"\n' +
  '"RF-2026-000136","found","Rinjen Sherpa","unknown","35","","","Rescued and reported safe near Syafrubesi.","active","true"\n' +
  '"RF-2026-000099","missing","Removed Case","male","20","Rasuwa","","x","removed","true"\n';

const SODHERA_MAPPING = {
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
};

describe("community-registry CSV (sodhera shape)", () => {
  it("maps report type to record type and drops removed rows", () => {
    const recs = csvToRecords(SODHERA_CSV, SODHERA_MAPPING);
    expect(recs).toHaveLength(2); // "removed" row skipped
    const missing = recs.find((r) => r.fullName === "Rajesh Syangtan")!;
    expect(missing.recordType).toBe("seeking");
    expect(missing.status).toBe("missing");
    expect(missing.unverified).toBe(true);
    const found = recs.find((r) => r.fullName === "Rinjen Sherpa")!;
    expect(found.recordType).toBe("info");
    expect(found.status).toBe("safe");
  });

  it("import marks records unverified and strips phone numbers", async () => {
    const recs = csvToRecords(SODHERA_CSV, SODHERA_MAPPING);
    for (const rec of recs) await upsertImported(rec, "sodhera-flood");

    const hits = await searchPersons({ q: "Rajesh Syangtan" });
    const hit = hits.find((p) => p.fullName === "Rajesh Syangtan")!;
    expect(hit.authorIsVerified).toBe(false);
    expect(hit.importedFrom).toMatch(/sodhera/i);

    const full = await getPersonPublic(hit.id);
    expect(full?.person.description ?? "").not.toMatch(/\d{6,}/);
    expect(full?.person.description ?? "").not.toMatch(/Contact:/i);
  });

  it("imported records are excluded from Khoj's own PFIF export", async () => {
    const { persons } = await allPublicForExport();
    expect(persons.some((p) => p.source.startsWith("import:"))).toBe(false);
    expect(persons.some((p) => p.fullName === "Rajesh Syangtan")).toBe(false);
  });
});

describe("official-sources config", () => {
  it("every entry has the required fields", () => {
    for (const s of OFFICIAL_SOURCES) {
      expect(s.id, s.name).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.authority).toBeTruthy();
      expect(["np", "in", "us", "intl"]).toContain(s.country);
      expect(["portal", "helpline", "feed"]).toContain(s.kind);
      if (s.kind === "feed") expect(s.feedFormat).toBeTruthy();
    }
  });

  it("enables only the community-registry feed by default", () => {
    const on = enabledFeeds();
    expect(on.map((s) => s.id)).toEqual(["sodhera-flood"]);
  });

  it("matches nationality to the right country bucket", () => {
    expect(toCountryCode("Nepali")).toBe("np");
    expect(toCountryCode("India")).toBe("in");
    expect(toCountryCode("Bhutan")).toBeNull();

    const forIndia = sourcesForCountry("Indian");
    expect(forIndia.some((s) => s.country === "in")).toBe(true);
    expect(forIndia.some((s) => s.country === "intl")).toBe(true);
    expect(forIndia.some((s) => s.country === "np")).toBe(false);
    expect(forIndia.some((s) => s.kind === "feed")).toBe(false);
  });
});
