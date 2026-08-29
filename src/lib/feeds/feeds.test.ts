import { describe, it, expect } from "vitest";
import { parsePfif } from "./pfif";
import { parseCsv, csvToRecords } from "./csv";
import { ingestPayload } from "./index";
import { toPfifDocument } from "@/lib/pfif";
import { searchPersons, getPersonPublic } from "@/lib/repo";
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
    const r1 = await ingestPayload("np-nrcs-rfl", xml, "pfif");
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
    const r2 = await ingestPayload("np-nrcs-rfl", xml, "pfif");
    expect(r2.imported).toBe(0);
    expect(r2.updated).toBe(1);

    const hits = await searchPersons({ q: "Imported Person" });
    expect(
      hits.filter((p) => p.fullName === "Imported Person"),
    ).toHaveLength(1);
  });
});

describe("official-sources config", () => {
  it("every entry has the required fields", () => {
    for (const s of OFFICIAL_SOURCES) {
      expect(s.id, s.name).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.authority).toBeTruthy();
      expect(["np", "in", "intl"]).toContain(s.country);
      expect(["portal", "helpline", "feed"]).toContain(s.kind);
      if (s.kind === "feed") expect(s.feedFormat).toBeTruthy();
    }
  });

  it("ships with all feeds disabled", () => {
    expect(enabledFeeds()).toHaveLength(0);
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
