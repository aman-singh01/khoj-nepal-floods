/**
 * Idempotent schema definition, applied by `npm run db:migrate` and by the test
 * setup. Kept as raw SQL (rather than generated migrations) so it runs the same
 * way on embedded PGlite and on a hosted Postgres. No extensions required -
 * fuzzy name ranking happens in the application (see src/lib/fuzzy.ts).
 */
export const DDL = /* sql */ `
DO $$ BEGIN
  CREATE TYPE record_type AS ENUM ('seeking', 'info');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sex AS ENUM ('female', 'male', 'other', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE person_status AS ENUM
    ('missing', 'seen_alive', 'safe', 'injured', 'deceased', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE moderation_state AS ENUM ('published', 'pending', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE note_type AS ENUM ('sighting', 'status_update', 'general');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM
    ('scam_or_fraud', 'fake_or_spam', 'privacy', 'duplicate', 'offensive', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS persons (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type        record_type NOT NULL DEFAULT 'seeking',
  full_name          text NOT NULL,
  name_normalized    text NOT NULL DEFAULT '',
  also_known_as      text,
  age_years          integer,
  age_is_approx      boolean NOT NULL DEFAULT false,
  sex                sex NOT NULL DEFAULT 'unknown',
  nationality        text,
  home_location      text,
  last_seen_location text,
  last_seen_at       timestamptz,
  description        text,
  photo_url          text,
  status             person_status NOT NULL DEFAULT 'missing',
  author_name        text,
  author_relation    text,
  author_email       text,
  author_phone       text,
  author_is_verified boolean NOT NULL DEFAULT false,
  edit_token         text NOT NULL,
  source             text NOT NULL DEFAULT 'web',
  pfif_record_id     text UNIQUE,
  linked_person_id   uuid,
  moderation_state   moderation_state NOT NULL DEFAULT 'published',
  report_count       integer NOT NULL DEFAULT 0,
  submitter_ip_hash  text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  expires_at         timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id           uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  note_type           note_type NOT NULL DEFAULT 'general',
  text                text NOT NULL,
  status_reported     person_status,
  last_known_location text,
  author_name         text,
  author_relation     text,
  author_email        text,
  author_phone        text,
  author_is_verified  boolean NOT NULL DEFAULT false,
  source              text NOT NULL DEFAULT 'web',
  pfif_note_id        text UNIQUE,
  moderation_state    moderation_state NOT NULL DEFAULT 'published',
  submitter_ip_hash   text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS abuse_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id       uuid REFERENCES persons(id) ON DELETE CASCADE,
  note_id         uuid REFERENCES notes(id) ON DELETE CASCADE,
  reason          report_reason NOT NULL DEFAULT 'other',
  detail          text,
  reporter_ip_hash text,
  resolved        boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id      uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  from_name      text NOT NULL,
  from_contact   text NOT NULL,
  message        text NOT NULL,
  sender_ip_hash text,
  delivered      boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE update_trust AS ENUM ('official', 'humanitarian', 'news');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS situation_updates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed         text NOT NULL,
  source       text NOT NULL,
  trust        update_trust NOT NULL DEFAULT 'news',
  title        text NOT NULL,
  summary      text,
  url          text NOT NULL,
  url_hash     text NOT NULL UNIQUE,
  published_at timestamptz NOT NULL,
  fetched_at   timestamptz NOT NULL DEFAULT now(),
  pinned       boolean NOT NULL DEFAULT false,
  hidden       boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS persons_name_idx ON persons (name_normalized);
CREATE INDEX IF NOT EXISTS persons_status_idx ON persons (status);
CREATE INDEX IF NOT EXISTS persons_moderation_idx ON persons (moderation_state);
CREATE INDEX IF NOT EXISTS persons_created_idx ON persons (created_at);
CREATE INDEX IF NOT EXISTS persons_ip_idx ON persons (submitter_ip_hash);
CREATE INDEX IF NOT EXISTS notes_person_idx ON notes (person_id);
CREATE INDEX IF NOT EXISTS notes_moderation_idx ON notes (moderation_state);
CREATE INDEX IF NOT EXISTS notes_ip_idx ON notes (submitter_ip_hash);
CREATE INDEX IF NOT EXISTS abuse_person_idx ON abuse_reports (person_id);
CREATE INDEX IF NOT EXISTS abuse_resolved_idx ON abuse_reports (resolved);
CREATE INDEX IF NOT EXISTS contact_person_idx ON contact_messages (person_id);
CREATE INDEX IF NOT EXISTS updates_published_idx ON situation_updates (published_at);
CREATE INDEX IF NOT EXISTS updates_trust_idx ON situation_updates (trust);
CREATE INDEX IF NOT EXISTS updates_hidden_idx ON situation_updates (hidden);
`;
