import type { NormalizedUpdate } from "./types";

/**
 * ReliefWeb v2 API adapter. ReliefWeb curates official situation reports,
 * government press releases and humanitarian updates per country/disaster.
 *
 * Since 1 Nov 2025 the API needs a pre-approved `appname` — register at
 * https://reliefweb.int/help/api . Until then this feed stays disabled.
 */
export async function fetchReliefWeb(
  appname: string,
  feedId: string,
): Promise<NormalizedUpdate[]> {
  const params = new URLSearchParams({
    appname,
    "query[value]": "flood OR flash flood OR glacial",
    "query[operator]": "OR",
    "filter[field]": "country",
    "filter[value]": "Nepal",
    "sort[]": "date.created:desc",
    limit: "25",
    "fields[include][]": "title",
  });
  params.append("fields[include][]", "url_alias");
  params.append("fields[include][]", "date.created");
  params.append("fields[include][]", "source.name");

  const res = await fetch(
    `https://api.reliefweb.int/v2/reports?${params.toString()}`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`reliefweb ${res.status}`);
  const json = (await res.json()) as {
    data?: {
      id: string;
      fields?: {
        title?: string;
        url_alias?: string;
        date?: { created?: string };
        source?: { name?: string }[];
      };
    }[];
  };

  const out: NormalizedUpdate[] = [];
  for (const r of json.data ?? []) {
    const f = r.fields ?? {};
    if (!f.title || !f.url_alias) continue;
    const published = f.date?.created ? new Date(f.date.created) : new Date();
    out.push({
      feed: feedId,
      source: f.source?.[0]?.name ?? "ReliefWeb",
      trust: "official",
      title: f.title,
      url: f.url_alias.startsWith("http")
        ? f.url_alias
        : `https://reliefweb.int${f.url_alias}`,
      publishedAt: Number.isNaN(published.getTime()) ? new Date() : published,
    });
  }
  return out;
}
