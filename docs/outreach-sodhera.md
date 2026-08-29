# Draft outreach — flood.sodhera.com

Send to: **admin@sodhera.com**
Fill in: `[YOUR NAME]`, `[KHOJ URL]` (once deployed), `[YOUR EMAIL]`.
Not yet sent.

---

**Subject:** Khoj — proposing a two-way sync between our two Nepal-flood missing-persons registries

Hi,

I run **Khoj** ([KHOJ URL]), a volunteer-built registry for reconnecting families
separated by the August 2026 Bhotekoshi–Trishuli flood — the same purpose as
flood.sodhera.com. Like yours, it is explicitly not an official database.

I found your `/api/export` and would rather coordinate than just consume it.
Two isolated boards help fewer families than two that share data, so I'd like to
propose a **two-way sync**:

- **From Khoj to you:** Khoj publishes every published record as **PFIF 1.4**
  (the interchange format used by the ICRC and Google Person Finder) at
  `[KHOJ URL]/api/pfif`, with `?since=` for deltas. You're welcome to pull it.
- **From you to Khoj:** Khoj would pull your CSV export on a schedule.

To do this cleanly I'd want to agree on a few things:

1. **Terms.** Is there any licence or restriction on the `/api/export` data, or
   is reuse-with-attribution fine?
2. **Attribution.** Khoj would show imported records as
   *"via flood.sodhera.com"* and link back. What wording / link do you prefer?
   We'd ask the same of anything of ours you ingest.
3. **Unverified status.** Khoj would carry your `unverified` flag through and
   never present those records as confirmed. Can we align on a shared
   convention both ways?
4. **De-duplication.** So records don't loop between the two sites: Khoj keys
   imports on your case number and would **exclude imported records from its own
   PFIF export**. Happy to do the reverse — e.g. you skip records whose source
   is Khoj.
5. **Removals.** If someone removes a record on your side (private code / safety
   link / email), how would you want that propagated so Khoj drops it too? A
   status flag in the export (e.g. `removed`) would let us handle it
   automatically.
6. **Contact details in free text.** Some of your `identifying details` fields
   contain family phone numbers. Khoj keeps contact details private by design,
   so we'd strip those on import. Flagging that in case you want to handle it
   differently.

If a PFIF endpoint would be more useful to you than CSV, or you'd like a
different field for cross-referencing case IDs, I'm glad to add it.

Thanks for building this — happy to share anything from our side that helps.

[YOUR NAME]
[YOUR EMAIL]
