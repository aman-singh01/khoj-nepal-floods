import { describe, it, expect } from "vitest";
import { normalizeName, cleanText, cleanMultiline } from "./text";

describe("normalizeName", () => {
  it("folds case and collapses whitespace", () => {
    expect(normalizeName("  Aarati   SHRESTHA ")).toBe("aarati shrestha");
  });

  it("strips diacritics so accented spellings match", () => {
    expect(normalizeName("Désirée")).toBe(normalizeName("Desiree"));
  });

  it("drops punctuation", () => {
    expect(normalizeName("O'Brien-Smith")).toBe("o brien smith");
  });

  it("keeps non-Latin scripts searchable", () => {
    expect(normalizeName("आरती")).toBe("आरती");
  });
});

describe("cleanText / cleanMultiline", () => {
  it("returns undefined for blank input", () => {
    expect(cleanText("   ")).toBeUndefined();
    expect(cleanMultiline("\n\n  \n")).toBeUndefined();
  });

  it("collapses internal whitespace in single-line text", () => {
    expect(cleanText("a\t b   c")).toBe("a b c");
  });

  it("caps blank-line runs in multiline text", () => {
    expect(cleanMultiline("a\n\n\n\n\nb")).toBe("a\n\nb");
  });
});
