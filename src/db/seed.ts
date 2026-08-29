/**
 * Insert a small set of clearly-fictional records for local development and
 * screenshots. Never run against production.
 *
 *   npm run db:seed
 */
import "./load-env";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { persons, notes } from "./schema";
import { normalizeName } from "../lib/text";
import { RECORD_TTL_DAYS } from "../lib/env";

const ttl = () => new Date(Date.now() + RECORD_TTL_DAYS * 86400_000);
const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000);

async function main() {
  const db = await getDb();
  const existing = await db.select({ id: persons.id }).from(persons).limit(1);
  if (existing.length) {
    console.log("Records already present - skipping seed.");
    return;
  }

  const rows = [
    {
      recordType: "seeking" as const,
      fullName: "Aarati Shrestha",
      alsoKnownAs: "Aaru",
      ageYears: 27,
      sex: "female" as const,
      nationality: "Nepal",
      homeLocation: "Sundarijal, Kathmandu",
      lastSeenLocation: "Melamchi bazaar, near the bridge",
      lastSeenAt: daysAgo(4),
      description:
        "Was wearing a green kurta and carrying a red backpack. Has a small scar on her left hand.",
      status: "missing" as const,
      authorName: "Bikash Shrestha",
      authorRelation: "brother",
      authorEmail: "example-bikash@example.com",
    },
    {
      recordType: "seeking" as const,
      fullName: "Ramesh Gurung",
      ageYears: 54,
      ageIsApprox: true,
      sex: "male" as const,
      nationality: "Nepal",
      homeLocation: "Bahrabise",
      lastSeenLocation: "Bahrabise market",
      lastSeenAt: daysAgo(5),
      description: "Diabetic, needs medication. Grey hair, walks with a limp.",
      status: "missing" as const,
      authorName: "Sita Gurung",
      authorRelation: "wife",
    },
    {
      recordType: "info" as const,
      fullName: "Anjali Thapa",
      ageYears: 19,
      sex: "female" as const,
      nationality: "India",
      lastSeenLocation: "Relief camp at Chautara school",
      description: "Safe at the Chautara relief camp as of this morning.",
      status: "safe" as const,
      authorName: "Volunteer desk, Chautara",
      authorRelation: "relief volunteer",
    },
    {
      recordType: "seeking" as const,
      fullName: "David Miller",
      ageYears: 32,
      sex: "male" as const,
      nationality: "United Kingdom",
      homeLocation: "Trekking group, Langtang route",
      lastSeenLocation: "Guesthouse near Syabrubesi",
      lastSeenAt: daysAgo(6),
      description:
        "Trekker, travelling with two friends who are accounted for. Tall, short brown hair, blue rain jacket.",
      status: "missing" as const,
      authorName: "Emma Miller",
      authorRelation: "sister",
      authorEmail: "example-emma@example.com",
    },
    {
      recordType: "seeking" as const,
      fullName: "Sunita Tamang",
      ageYears: 8,
      sex: "female" as const,
      nationality: "Nepal",
      homeLocation: "Melamchi",
      lastSeenLocation: "Separated from family during evacuation near Melamchi",
      lastSeenAt: daysAgo(4),
      description:
        "Child, separated from parents during the evacuation. Wearing a school uniform (blue and white).",
      status: "missing" as const,
      authorName: "Krishna Tamang",
      authorRelation: "father",
      authorPhone: "+977-98XXXXXXXX",
    },
  ];

  for (const r of rows) {
    await db.insert(persons).values({
      ...r,
      nameNormalized: normalizeName(`${r.fullName} ${r.alsoKnownAs ?? ""}`),
      editToken: randomUUID(),
      source: "seed",
      expiresAt: ttl(),
    });
  }

  const [aarati] = await db
    .select()
    .from(persons)
    .where(eq(persons.fullName, "Aarati Shrestha"));
  if (aarati) {
    await db.insert(notes).values({
      personId: aarati.id,
      noteType: "sighting",
      text: "I think I saw someone matching this description at the Melamchi relief camp on Tuesday. Not certain.",
      lastKnownLocation: "Melamchi relief camp",
      authorName: "Hari (camp coordinator)",
      authorRelation: "coordinator",
      source: "seed",
    });
  }

  console.log(`Seeded ${rows.length} records.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
