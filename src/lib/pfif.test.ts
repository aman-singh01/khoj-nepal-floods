import { describe, it, expect } from "vitest";
import { toPfifDocument } from "./pfif";
import type { Person, Note } from "@/db/schema";

function person(overrides: Partial<Person> = {}): Person {
  const now = new Date("2026-08-20T10:00:00Z");
  return {
    id: "11111111-1111-1111-1111-111111111111",
    recordType: "seeking",
    fullName: "Aarati Shrestha",
    nameNormalized: "aarati shrestha",
    alsoKnownAs: null,
    ageYears: 27,
    ageIsApprox: false,
    sex: "female",
    nationality: "Nepal",
    homeLocation: "Kathmandu",
    lastSeenLocation: "Melamchi",
    lastSeenAt: null,
    description: "Green kurta, red backpack",
    photoUrl: null,
    status: "missing",
    authorName: "Bikash Shrestha",
    authorRelation: "brother",
    authorEmail: "private@example.com",
    authorPhone: "+977000",
    authorIsVerified: false,
    editToken: "tok",
    source: "web",
    pfifRecordId: null,
    linkedPersonId: null,
    feedMissingSince: null,
    moderationState: "published",
    reportCount: 0,
    submitterIpHash: null,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date("2027-02-20T10:00:00Z"),
    ...overrides,
  };
}

describe("toPfifDocument", () => {
  it("emits a PFIF 1.4 document with the person's public fields", () => {
    const xml = toPfifDocument([person()], []);
    expect(xml).toContain('<pfif:pfif xmlns:pfif="http://zesty.ca/pfif/1.4">');
    expect(xml).toContain("<pfif:full_name>Aarati Shrestha</pfif:full_name>");
    expect(xml).toContain("<pfif:family_name>Shrestha</pfif:family_name>");
    expect(xml).toContain("<pfif:age>27</pfif:age>");
    expect(xml).toContain("person.11111111-1111-1111-1111-111111111111");
  });

  it("marks a sought person as information_sought", () => {
    expect(toPfifDocument([person()], [])).toContain(
      "<pfif:status>information_sought</pfif:status>",
    );
  });

  it("maps 'safe' to believed_alive", () => {
    const xml = toPfifDocument([person({ recordType: "info", status: "safe" })], []);
    expect(xml).toContain("<pfif:status>believed_alive</pfif:status>");
  });

  it("never leaks submitter email or phone", () => {
    const xml = toPfifDocument([person()], []);
    expect(xml).not.toContain("private@example.com");
    expect(xml).not.toContain("+977000");
  });

  it("escapes XML metacharacters", () => {
    const xml = toPfifDocument([person({ fullName: "A & B <hero>" })], []);
    expect(xml).toContain("A &amp; B &lt;hero&gt;");
  });

  it("includes attached notes", () => {
    const note = {
      id: "22222222-2222-2222-2222-222222222222",
      personId: "11111111-1111-1111-1111-111111111111",
      noteType: "sighting",
      text: "Seen at the camp",
      statusReported: "seen_alive",
      lastKnownLocation: "Chautara",
      authorName: "Volunteer",
      authorRelation: null,
      authorEmail: null,
      authorPhone: null,
      authorIsVerified: false,
      source: "web",
      pfifNoteId: null,
      moderationState: "published",
      submitterIpHash: null,
      createdAt: new Date("2026-08-21T08:00:00Z"),
    } as unknown as Note;

    const xml = toPfifDocument([person()], [note]);
    expect(xml).toContain("<pfif:text>Seen at the camp</pfif:text>");
    expect(xml).toContain("note.22222222-2222-2222-2222-222222222222");
  });
});
