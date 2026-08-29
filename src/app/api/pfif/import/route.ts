import { tokenValid, isModerator } from "@/lib/moderation-auth";
import { ingestPayload, ingestFeed } from "@/lib/feeds";
import { sourceById } from "@/config/official-sources";
import type { OfficialSource } from "@/config/official-sources";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function authorised(req: Request): Promise<boolean> {
  const header =
    req.headers.get("x-khoj-token") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (tokenValid(header)) return true;
  return isModerator();
}

/**
 * Import records from a partner / official feed.
 *
 *   # PFIF document in the body
 *   POST /api/pfif/import?source=feed-partner-pfif
 *   Content-Type: application/xml
 *   x-khoj-token: <MODERATION_TOKEN>
 *   <pfif:pfif ...>...</pfif:pfif>
 *
 *   # or trigger a pull of a configured / ad-hoc feed URL
 *   POST /api/pfif/import
 *   Content-Type: application/json
 *   { "sourceId": "feed-partner-pfif" }
 *   { "url": "https://...", "format": "csv", "mapping": {...}, "sourceId": "..." }
 */
export async function POST(req: Request) {
  if (!(await authorised(req))) {
    return Response.json({ error: "unauthorised" }, { status: 403 });
  }

  const url = new URL(req.url);
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as {
        sourceId?: string;
        url?: string;
        format?: OfficialSource["feedFormat"];
        mapping?: Record<string, string>;
        xml?: string;
      };
      const sourceId = body.sourceId ?? "manual";

      if (body.xml) {
        const result = await ingestPayload(sourceId, body.xml, "pfif");
        return Response.json(result);
      }

      const configured = body.sourceId ? sourceById(body.sourceId) : undefined;
      if (configured && configured.kind === "feed") {
        const result = await ingestFeed(
          body.url ? { ...configured, url: body.url } : configured,
        );
        return Response.json(result);
      }
      if (body.url && body.format) {
        const result = await ingestFeed({
          id: sourceId,
          name: sourceId,
          authority: "ad-hoc",
          country: "intl",
          kind: "feed",
          purpose: "",
          url: body.url,
          phone: null,
          feedFormat: body.format,
          feedMapping: body.mapping,
          enabled: true,
          verified: false,
        });
        return Response.json(result);
      }
      return Response.json(
        { error: "provide xml, or a configured sourceId, or url+format" },
        { status: 400 },
      );
    }

    // Raw PFIF body
    const sourceId = url.searchParams.get("source") ?? "manual";
    const xml = await req.text();
    if (!xml.trim()) {
      return Response.json({ error: "empty body" }, { status: 400 });
    }
    const result = await ingestPayload(sourceId, xml, "pfif");
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
