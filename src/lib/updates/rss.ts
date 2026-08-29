import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: true,
  isArray: (name) => name === "item" || name === "entry",
});

export interface RawFeedItem {
  title?: string;
  link?: string;
  summary?: string;
  source?: string; // per-item publisher (Google News puts one here)
  publishedAt?: Date;
}

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return str(v[0]);
  if (typeof v === "object" && "#text" in (v as object)) {
    return String((v as { "#text": unknown })["#text"]).trim() || undefined;
  }
  const s = String(v).trim();
  return s.length ? s : undefined;
}

export function stripHtml(html: string | undefined, max = 400): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<\s*br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function atomLink(link: unknown): string | undefined {
  if (typeof link === "string") return link;
  const arr = (Array.isArray(link) ? link : link ? [link] : []) as Record<
    string,
    unknown
  >[];
  const alt = arr.find((l) => l["@_rel"] === "alternate" || !l["@_rel"]);
  return str((alt ?? arr[0])?.["@_href"]) ?? (arr.length ? str(arr[0]) : undefined);
}

function parseDate(...vals: unknown[]): Date | undefined {
  for (const v of vals) {
    const s = str(v);
    if (!s) continue;
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
}

/** Parse an RSS 2.0 or Atom feed into raw items. */
export function parseFeed(xml: string): RawFeedItem[] {
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel ?? doc?.channel;
  const feed = doc?.feed;

  if (channel) {
    const items: Record<string, unknown>[] = Array.isArray(channel.item)
      ? channel.item
      : channel.item
        ? [channel.item]
        : [];
    return items.map((it) => ({
      title: str(it.title),
      link: str(it.link) ?? atomLink(it.link),
      summary:
        stripHtml(str(it["encoded"])) ?? stripHtml(str(it.description)),
      source: str(it.source),
      publishedAt: parseDate(it.pubDate, it.date, it["dc:date"]),
    }));
  }

  if (feed) {
    const entries: Record<string, unknown>[] = Array.isArray(feed.entry)
      ? feed.entry
      : feed.entry
        ? [feed.entry]
        : [];
    return entries.map((e) => ({
      title: str(e.title),
      link: atomLink(e.link),
      summary: stripHtml(str(e.summary)) ?? stripHtml(str(e.content)),
      source: str((e.source as Record<string, unknown>)?.title),
      publishedAt: parseDate(e.updated, e.published),
    }));
  }

  return [];
}

/** Google News titles are "Headline - Publisher"; split that out. */
export function splitGoogleNewsTitle(title: string): {
  title: string;
  source?: string;
} {
  const m = title.match(/^(.*?)\s+-\s+([^-]+)$/);
  if (m && m[2].length <= 60) return { title: m[1].trim(), source: m[2].trim() };
  return { title };
}
