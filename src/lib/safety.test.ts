import { describe, it, expect } from "vitest";
import { screenText, isBotSubmission } from "./safety";

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
