import { describe, it, expect } from "vitest";
import { parseFeed, stripHtml, splitGoogleNewsTitle } from "./rss";
import {
  upsertUpdate,
  recentUpdates,
  updatesVersion,
  setUpdateFlags,
  hashUrl,
} from "@/lib/repo";

const RSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Example</title>
    <item>
      <title>Rescue teams reach Rasuwa - Kathmandu Post</title>
      <link>https://example.org/a</link>
      <description>&lt;a href="x"&gt;Teams&lt;/a&gt; reached the valley &amp;amp; began searching.</description>
      <pubDate>Thu, 28 Aug 2026 09:00:00 GMT</pubDate>
      <source url="https://kathmandupost.com">Kathmandu Post</source>
    </item>
    <item>
      <title>Death toll rises</title>
      <link>https://example.org/b</link>
      <pubDate>Wed, 27 Aug 2026 09:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>UN News</title>
  <entry>
    <title>Himalayan flood: UN steps up aid</title>
    <link rel="alternate" href="https://news.un.org/story/1"/>
    <summary>OCHA released emergency funds for Nepal.</summary>
    <updated>2026-08-27T12:00:00Z</updated>
  </entry>
</feed>`;

describe("parseFeed", () => {
  it("reads RSS 2.0 items", () => {
    const items = parseFeed(RSS);
    expect(items).toHaveLength(2);
    expect(items[0].link).toBe("https://example.org/a");
    expect(items[0].source).toBe("Kathmandu Post");
    expect(items[0].summary).toContain("Teams reached the valley &");
    expect(items[0].publishedAt?.getUTCFullYear()).toBe(2026);
  });

  it("reads Atom entries", () => {
    const items = parseFeed(ATOM);
    expect(items).toHaveLength(1);
    expect(items[0].title).toMatch(/Himalayan flood/);
    expect(items[0].link).toBe("https://news.un.org/story/1");
    expect(items[0].summary).toBe("OCHA released emergency funds for Nepal.");
  });
});

describe("helpers", () => {
  it("stripHtml removes tags, decodes entities, truncates", () => {
    expect(stripHtml("<b>Hi</b> &amp; bye")).toBe("Hi & bye");
    expect(stripHtml("x".repeat(500), 10)).toHaveLength(10);
  });

  it("splitGoogleNewsTitle splits headline from publisher", () => {
    expect(splitGoogleNewsTitle("Big news here - Reuters")).toEqual({
      title: "Big news here",
      source: "Reuters",
    });
    expect(splitGoogleNewsTitle("No publisher suffix")).toEqual({
      title: "No publisher suffix",
    });
  });
});

describe("update storage", () => {
  const base = {
    feed: "test",
    source: "Test Wire",
    trust: "news" as const,
    title: "A headline",
    url: "https://example.org/story-1",
    publishedAt: new Date("2026-08-28T10:00:00Z"),
  };

  it("dedupes on URL", async () => {
    expect(await upsertUpdate(base)).toBe(true);
    expect(await upsertUpdate({ ...base, title: "changed" })).toBe(false);
    const list = await recentUpdates({});
    expect(list.filter((u) => u.url === base.url)).toHaveLength(1);
  });

  it("updatesVersion moves when a new item lands", async () => {
    const v1 = await updatesVersion();
    await upsertUpdate({
      ...base,
      url: "https://example.org/story-2",
      publishedAt: new Date("2026-08-29T10:00:00Z"),
    });
    expect(await updatesVersion()).not.toBe(v1);
  });

  it("pinned items sort first and hidden items drop out", async () => {
    await upsertUpdate({
      ...base,
      url: "https://example.org/story-old",
      publishedAt: new Date("2020-01-01T00:00:00Z"),
    });
    const beforeList = await recentUpdates({});
    const oldRow = beforeList.find(
      (u) => u.url === "https://example.org/story-old",
    )!;
    await setUpdateFlags(oldRow.id, { pinned: true });
    const pinnedList = await recentUpdates({});
    expect(pinnedList[0].id).toBe(oldRow.id);

    await setUpdateFlags(oldRow.id, { hidden: true, pinned: false });
    const visible = await recentUpdates({});
    expect(visible.find((u) => u.id === oldRow.id)).toBeUndefined();
  });

  it("hashUrl is stable and case-insensitive", () => {
    expect(hashUrl("https://X.org/A ")).toBe(hashUrl("https://x.org/a"));
  });
});
