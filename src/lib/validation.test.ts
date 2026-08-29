import { describe, it, expect } from "vitest";
import { personInput, noteInput } from "./validation";

const basePerson = {
  recordType: "seeking",
  fullName: "Test Person",
  authorName: "Reporter",
  consent: "on",
};

describe("personInput", () => {
  it("treats an empty age field as no age (not 0)", () => {
    const r = personInput.parse({ ...basePerson, ageYears: "" });
    expect(r.ageYears).toBeUndefined();
  });

  it("parses a real age", () => {
    const r = personInput.parse({ ...basePerson, ageYears: "42" });
    expect(r.ageYears).toBe(42);
  });

  it("reads the approx checkbox", () => {
    expect(personInput.parse({ ...basePerson }).ageIsApprox).toBe(false);
    expect(
      personInput.parse({ ...basePerson, ageIsApprox: "on" }).ageIsApprox,
    ).toBe(true);
  });

  it("requires consent", () => {
    const r = personInput.safeParse({ ...basePerson, consent: undefined });
    expect(r.success).toBe(false);
  });

  it("drops a blank optional email", () => {
    const r = personInput.parse({ ...basePerson, authorEmail: "" });
    expect(r.authorEmail).toBeUndefined();
  });

  it("rejects a malformed email", () => {
    const r = personInput.safeParse({ ...basePerson, authorEmail: "not-an-email" });
    expect(r.success).toBe(false);
  });
});

describe("noteInput", () => {
  const baseNote = {
    personId: "11111111-1111-1111-1111-111111111111",
    text: "I saw them at the camp",
    authorName: "Witness",
  };

  it("treats an empty status select as 'no change'", () => {
    const r = noteInput.parse({ ...baseNote, statusReported: "" });
    expect(r.statusReported).toBeUndefined();
  });

  it("keeps a chosen status", () => {
    const r = noteInput.parse({ ...baseNote, statusReported: "safe" });
    expect(r.statusReported).toBe("safe");
  });
});
