/**
 * Sources for the live "Updates" stream about this emergency.
 *
 * Khoj does not author or fact-check these items — each one links back to its
 * origin and carries a trust label. Keep the list small and reputable; a noisy
 * feed becomes a misinformation vector.
 */

export type UpdateTrust = "official" | "humanitarian" | "news";

export type UpdateFeedKind = "gnews" | "rss" | "reliefweb";

export interface UpdateFeed {
  id: string;
  name: string;
  kind: UpdateFeedKind;
  /** RSS/Atom URL for `rss` and `gnews`; ignored for `reliefweb`. */
  url: string;
  trust: UpdateTrust;
  enabled: boolean;
  /**
   * For broad feeds (e.g. a region-wide news feed): keep an item only if its
   * title or summary contains one of these (case-insensitive).
   */
  filter?: string[];
  /** ReliefWeb requires a pre-approved appname since 1 Nov 2025. */
  reliefwebAppname?: string;
}

const EVENT_TERMS = [
  "nepal",
  "rasuwa",
  "nuwakot",
  "trishuli",
  "bhote koshi",
  "bhotekoshi",
  "langtang",
  "himalayan flood",
  "glacial",
  "glacier collapse",
];

export const UPDATE_FEEDS: UpdateFeed[] = [
  {
    id: "gnews-event",
    name: "Google News — flood coverage",
    kind: "gnews",
    url:
      "https://news.google.com/rss/search?q=" +
      encodeURIComponent(
        'Nepal flood (Rasuwa OR Nuwakot OR Trishuli OR Bhotekoshi OR Langtang OR "glacial") when:14d',
      ) +
      "&hl=en-US&gl=US&ceid=US:en",
    trust: "news",
    enabled: true,
  },
  {
    id: "unnews-asia",
    name: "UN News — Asia-Pacific",
    kind: "rss",
    url: "https://news.un.org/feed/subscribe/en/news/region/asia-pacific/feed/rss.xml",
    trust: "humanitarian",
    enabled: true,
    filter: EVENT_TERMS,
  },
  {
    id: "reliefweb-nepal",
    name: "ReliefWeb — Nepal reports (needs appname)",
    kind: "reliefweb",
    url: "",
    trust: "official",
    enabled: false,
    reliefwebAppname: "", // register at https://reliefweb.int/help/api  then set + enable
  },
];

export function enabledUpdateFeeds(): UpdateFeed[] {
  return UPDATE_FEEDS.filter(
    (f) => f.enabled && (f.kind === "reliefweb" ? !!f.reliefwebAppname : !!f.url),
  );
}

/** How long a fetched batch stays "fresh" before a page view triggers a re-pull. */
export const UPDATES_TTL_MINUTES = 12;

export { EVENT_TERMS };
