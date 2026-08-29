import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * A record type mirrors the two questions people arrive with:
 *  - "seeking": I am looking for this person.
 *  - "info":    I have information about this person (I saw them / they are safe / ...).
 * Both produce a `persons` row; the UI merges rows that describe the same person.
 */
export const recordTypeEnum = pgEnum("record_type", ["seeking", "info"]);

export const sexEnum = pgEnum("sex", ["female", "male", "other", "unknown"]);

/**
 * Status of the person, not of the record. `missing` is the default for a
 * "seeking" record; an "info" record usually carries a more specific status.
 */
export const personStatusEnum = pgEnum("person_status", [
  "missing",
  "seen_alive",
  "safe",
  "injured",
  "deceased",
  "unknown",
]);

export const moderationStateEnum = pgEnum("moderation_state", [
  "published",
  "pending",
  "hidden",
]);

export const noteTypeEnum = pgEnum("note_type", [
  "sighting",
  "status_update",
  "general",
]);

export const reportReasonEnum = pgEnum("report_reason", [
  "scam_or_fraud",
  "fake_or_spam",
  "privacy",
  "duplicate",
  "offensive",
  "other",
]);

export const persons = pgTable(
  "persons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recordType: recordTypeEnum("record_type").notNull().default("seeking"),

    // Identity
    fullName: text("full_name").notNull(),
    // Diacritic-folded, lowercased copy of fullName for trigram search.
    nameNormalized: text("name_normalized").notNull().default(""),
    alsoKnownAs: text("also_known_as"),
    ageYears: integer("age_years"),
    ageIsApprox: boolean("age_is_approx").notNull().default(false),
    sex: sexEnum("sex").notNull().default("unknown"),
    nationality: text("nationality"), // free text or ISO-3166 alpha-2

    // Where
    homeLocation: text("home_location"),
    lastSeenLocation: text("last_seen_location"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),

    // Details
    description: text("description"), // clothing, build, distinguishing marks
    photoUrl: text("photo_url"),
    status: personStatusEnum("status").notNull().default("missing"),

    // Who submitted (contact details are NEVER exposed in public API responses)
    authorName: text("author_name"),
    authorRelation: text("author_relation"),
    authorEmail: text("author_email"),
    authorPhone: text("author_phone"),
    authorIsVerified: boolean("author_is_verified").notNull().default(false),

    // Self-service edit/delete without accounts
    editToken: text("edit_token").notNull(),

    // Provenance / interoperability
    source: text("source").notNull().default("web"),
    pfifRecordId: text("pfif_record_id").unique(),
    linkedPersonId: uuid("linked_person_id"),
    // For imported records: set when the row stops appearing in its source feed.
    feedMissingSince: timestamp("feed_missing_since", { withTimezone: true }),

    // Safety
    moderationState: moderationStateEnum("moderation_state")
      .notNull()
      .default("published"),
    reportCount: integer("report_count").notNull().default(0),
    submitterIpHash: text("submitter_ip_hash"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("persons_name_idx").on(t.nameNormalized),
    index("persons_status_idx").on(t.status),
    index("persons_moderation_idx").on(t.moderationState),
    index("persons_created_idx").on(t.createdAt),
    index("persons_ip_idx").on(t.submitterIpHash),
  ],
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    noteType: noteTypeEnum("note_type").notNull().default("general"),
    text: text("text").notNull(),
    statusReported: personStatusEnum("status_reported"),
    lastKnownLocation: text("last_known_location"),

    authorName: text("author_name"),
    authorRelation: text("author_relation"),
    authorEmail: text("author_email"),
    authorPhone: text("author_phone"),
    authorIsVerified: boolean("author_is_verified").notNull().default(false),

    source: text("source").notNull().default("web"),
    pfifNoteId: text("pfif_note_id").unique(),

    moderationState: moderationStateEnum("moderation_state")
      .notNull()
      .default("published"),
    submitterIpHash: text("submitter_ip_hash"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("notes_person_idx").on(t.personId),
    index("notes_moderation_idx").on(t.moderationState),
    index("notes_ip_idx").on(t.submitterIpHash),
  ],
);

export const abuseReports = pgTable(
  "abuse_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personId: uuid("person_id").references(() => persons.id, {
      onDelete: "cascade",
    }),
    noteId: uuid("note_id").references(() => notes.id, { onDelete: "cascade" }),
    reason: reportReasonEnum("reason").notNull().default("other"),
    detail: text("detail"),
    reporterIpHash: text("reporter_ip_hash"),
    resolved: boolean("resolved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("abuse_person_idx").on(t.personId),
    index("abuse_resolved_idx").on(t.resolved),
  ],
);

/**
 * Mediated messages: a searcher can send a message to the person who submitted a
 * record without ever seeing their contact details. Moderators / responders
 * relay it. Stored here; delivery (email/SMS) is a follow-up integration.
 */
export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    fromName: text("from_name").notNull(),
    fromContact: text("from_contact").notNull(), // how to reach the sender
    message: text("message").notNull(),
    senderIpHash: text("sender_ip_hash"),
    delivered: boolean("delivered").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("contact_person_idx").on(t.personId)],
);

/**
 * Aggregated situation updates about the emergency — pulled from external news
 * and humanitarian feeds. Every row links back to its origin; Khoj does not
 * author or verify these.
 */
export const updateTrustEnum = pgEnum("update_trust", [
  "official",
  "humanitarian",
  "news",
]);

export const situationUpdates = pgTable(
  "situation_updates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    feed: text("feed").notNull(), // config id it came from, or "manual"
    source: text("source").notNull(), // publisher name
    trust: updateTrustEnum("trust").notNull().default("news"),
    title: text("title").notNull(),
    summary: text("summary"),
    url: text("url").notNull(),
    urlHash: text("url_hash").notNull().unique(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    pinned: boolean("pinned").notNull().default(false),
    hidden: boolean("hidden").notNull().default(false),
  },
  (t) => [
    index("updates_published_idx").on(t.publishedAt),
    index("updates_trust_idx").on(t.trust),
    index("updates_hidden_idx").on(t.hidden),
  ],
);

export type Person = typeof persons.$inferSelect;
export type NewPerson = typeof persons.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type AbuseReport = typeof abuseReports.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type SituationUpdate = typeof situationUpdates.$inferSelect;
export type NewSituationUpdate = typeof situationUpdates.$inferInsert;
