import { describe, it, expect } from "vitest";
import { screenText, isBotSubmission, scrubContacts } from "./safety";

describe("screenText", () => {
  it("passes an ordinary description", () => {
    const r = screenText(
      "Last seen wearing a green jacket near the Melamchi bridge.",
      "Bikash",
    );
    expect(r.hold).toBe(false);
  });

  it("holds text demanding money", () => {
    const r = screenText("I have your daughter. Send $500 by Western Union.");
    expect(r.hold).toBe(true);
    expect(r.reasons.join(" ")).toMatch(/payment/i);
  });

  it("holds text with a crypto wallet ask", () => {
    expect(screenText("pay in bitcoin to release him").hold).toBe(true);
  });

  it("flags a phone number buried in free text", () => {
    const r = screenText("call me on +977 9812345678 for info");
    expect(r.hold).toBe(true);
    expect(r.reasons.join(" ")).toMatch(/phone number or email/i);
  });
});

describe("scrubContacts", () => {
  it("removes labelled phone numbers and family contacts", () => {
    const out = scrubContacts(
      "Age 21. Last seen at Timure. Contact: 9863267631. Family contacts: 9848944392, 9862739811.",
    );
    expect(out).toBe("Age 21. Last seen at Timure.");
  });

  it("removes bare phone-like runs and emails", () => {
    const out = scrubContacts("Call +977 980-1234567 or write me@example.com now");
    expect(out).not.toMatch(/\d{5}/);
    expect(out).not.toContain("@");
  });

  it("leaves clean text and short numbers alone", () => {
    expect(scrubContacts("Wearing a red jacket, about 45 years old")).toBe(
      "Wearing a red jacket, about 45 years old",
    );
  });

  it("returns undefined for empty / all-scrubbed input", () => {
    expect(scrubContacts("")).toBeUndefined();
    expect(scrubContacts("Contact: 9863267631")).toBeUndefined();
  });
});

describe("isBotSubmission", () => {
  it("is true when the honeypot is filled", () => {
    const fd = new FormData();
    fd.set("company_website", "http://spam.example");
    expect(isBotSubmission(fd)).toBe(true);
  });

  it("is false when the honeypot is empty/absent", () => {
    expect(isBotSubmission(new FormData())).toBe(false);
  });
});
