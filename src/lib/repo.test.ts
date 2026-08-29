import { describe, it, expect } from "vitest";
import {
  createPerson,
  addNote,
  fileReport,
  searchPersons,
  getPersonPublic,
  stats,
} from "./repo";
import type { PersonInput } from "./validation";

function baseInput(over: Partial<PersonInput> = {}): PersonInput {
  return {
    recordType: "seeking",
    fullName: "Ramesh Gurung",
    alsoKnownAs: undefined,
    ageYears: 54,
    ageIsApprox: false,
    sex: "male",
    nationality: "Nepal",
    homeLocation: "Bahrabise",
    lastSeenLocation: "Bahrabise market",
    lastSeenAt: undefined,
    description: "Grey hair, walks with a limp.",
    status: "missing",
    authorName: "Sita Gurung",
    authorRelation: "wife",
    authorEmail: undefined,
    authorPhone: undefined,
    consent: true,
    ...over,
  } as PersonInput;
}

const ctx = { ipHash: "hash-a" };

describe("createPerson + search", () => {
  it("finds a record by a fuzzy misspelling of the name", async () => {
    await createPerson(baseInput({ fullName: "Aarati Shrestha" }), ctx);

    const hit = await searchPersons({ q: "arati shresta" });
    expect(hit.some((p) => p.fullName === "Aarati Shrestha")).toBe(true);
  });

  it("omits submitter contact details from public results", async () => {
    const { id } = await createPerson(
      baseInput({ fullName: "Private Contact", authorEmail: "me@example.com" }),
      ctx,
    );
    const res = await getPersonPublic(id);
    expect(res).not.toBeNull();
    expect(JSON.stringify(res)).not.toContain("me@example.com");
  });

  it("holds a record that demands money and keeps it out of search", async () => {
    const { id, held } = await createPerson(
      baseInput({
        fullName: "Scam Test",
        description: "Send $900 by MoneyGram to release him.",
      }),
      ctx,
    );
    expect(held).toBe(true);

    const results = await searchPersons({ q: "Scam Test" });
    expect(results.find((p) => p.id === id)).toBeUndefined();
  });
});

describe("addNote", () => {
  it("moves the person's status when a status update is posted", async () => {
    const { id } = await createPerson(
      baseInput({ fullName: "Statusy Person" }),
      ctx,
    );

    await addNote(
      {
        personId: id,
        noteType: "status_update",
        text: "She is safe at the Chautara camp.",
        statusReported: "safe",
        lastKnownLocation: "Chautara",
        authorName: "Volunteer",
        authorRelation: undefined,
        authorEmail: undefined,
        authorPhone: undefined,
      },
      ctx,
    );

    const res = await getPersonPublic(id);
    expect(res?.person.status).toBe("safe");
    expect(res?.notes).toHaveLength(1);
  });
});

describe("fileReport", () => {
  it("pushes a record into moderation after enough reports", async () => {
    const { id } = await createPerson(baseInput({ fullName: "Reported Person" }), ctx);

    for (const ipHash of ["r1", "r2", "r3"]) {
      await fileReport({ personId: id, reason: "scam_or_fraud", ipHash });
    }

    const res = await getPersonPublic(id);
    // still fetchable directly, but no longer 'published'
    expect(res?.person).toBeTruthy();
    const inSearch = await searchPersons({ q: "Reported Person" });
    expect(inSearch.find((p) => p.id === id)).toBeUndefined();
  });
});

describe("stats", () => {
  it("counts published seeking records", async () => {
    const before = await stats();
    await createPerson(baseInput({ fullName: "Counted Person" }), ctx);
    const after = await stats();
    expect(after.seeking).toBeGreaterThan(before.seeking);
  });
});
