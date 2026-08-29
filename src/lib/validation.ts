import { z } from "zod";

export const RECORD_TYPES = ["seeking", "info"] as const;
export const SEXES = ["female", "male", "other", "unknown"] as const;
export const STATUSES = [
  "missing",
  "seen_alive",
  "safe",
  "injured",
  "deceased",
  "unknown",
] as const;
export const REPORT_REASONS = [
  "scam_or_fraud",
  "fake_or_spam",
  "privacy",
  "duplicate",
  "offensive",
  "other",
] as const;

export const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  missing: "Missing",
  seen_alive: "Seen alive",
  safe: "Safe",
  injured: "Injured / in hospital",
  deceased: "Deceased",
  unknown: "Unknown",
};

export const REASON_LABELS: Record<(typeof REPORT_REASONS)[number], string> = {
  scam_or_fraud: "Scam or fraud (asking for money)",
  fake_or_spam: "Fake or spam",
  privacy: "Privacy concern",
  duplicate: "Duplicate of another record",
  offensive: "Offensive content",
  other: "Something else",
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length ? v : undefined));

/** Shape shared by the "report someone" and "add information" forms. */
export const personInput = z.object({
  recordType: z.enum(RECORD_TYPES),
  fullName: z.string().trim().min(2, "Please enter a name.").max(160),
  alsoKnownAs: optionalText(160),
  ageYears: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(0).max(130).optional(),
  ),
  ageIsApprox: z.preprocess(
    (v) => v === "on" || v === "true" || v === true,
    z.boolean(),
  ),
  sex: z.enum(SEXES).default("unknown"),
  nationality: optionalText(80),
  homeLocation: optionalText(200),
  lastSeenLocation: optionalText(200),
  lastSeenAt: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length ? new Date(v) : undefined))
    .refine((d) => !d || !Number.isNaN(d.getTime()), "Invalid date."),
  description: optionalText(2000),
  status: z.enum(STATUSES).default("missing"),

  authorName: z.string().trim().min(1, "Please tell us who is reporting.").max(120),
  authorRelation: optionalText(80),
  authorEmail: z
    .string()
    .trim()
    .email("Enter a valid email or leave it blank.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  authorPhone: optionalText(40),
  consent: z.preprocess(
    (v) => v === "on" || v === "true" || v === "1" || v === true,
    z.literal(true, { message: "You must confirm consent before publishing." }),
  ),
});

export type PersonInput = z.infer<typeof personInput>;

export const noteInput = z.object({
  personId: z.string().uuid(),
  noteType: z.enum(["sighting", "status_update", "general"]).default("general"),
  text: z.string().trim().min(3, "Please write a short note.").max(2000),
  statusReported: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.enum(STATUSES).optional(),
  ),
  lastKnownLocation: optionalText(200),
  authorName: z.string().trim().min(1, "Please add your name.").max(120),
  authorRelation: optionalText(80),
  authorEmail: z
    .string()
    .trim()
    .email("Enter a valid email or leave it blank.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  authorPhone: optionalText(40),
});

export type NoteInput = z.infer<typeof noteInput>;

export const reportInput = z.object({
  personId: z.string().uuid().optional(),
  noteId: z.string().uuid().optional(),
  reason: z.enum(REPORT_REASONS),
  detail: optionalText(1000),
});

export const contactInput = z.object({
  personId: z.string().uuid(),
  fromName: z.string().trim().min(1, "Please add your name.").max(120),
  fromContact: z
    .string()
    .trim()
    .min(3, "Add a phone number or email so they can reach you.")
    .max(160),
  message: z.string().trim().min(5, "Please write a message.").max(2000),
});
