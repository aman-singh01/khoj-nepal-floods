"use client";

import { useActionState, useState } from "react";
import { submitPerson } from "@/app/actions";
import type { ActionState } from "@/lib/forms";
import { Field, inputClass } from "./Field";
import { Callout } from "./Callout";
import { SubmitButton } from "./SubmitButton";
import { SEXES, STATUSES, STATUS_LABELS } from "@/lib/validation";

const initial: ActionState = { ok: false };

export function ReportForm({
  defaultType = "seeking",
  defaultName = "",
}: {
  defaultType?: "seeking" | "info";
  defaultName?: string;
}) {
  const [state, action] = useActionState(submitPerson, initial);
  const [type, setType] = useState<"seeking" | "info">(defaultType);
  const err = state.errors ?? {};

  return (
    <form action={action} encType="multipart/form-data" className="space-y-5">
      {state.message && !state.ok && (
        <Callout tone="danger">{state.message}</Callout>
      )}

      <fieldset className="rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">This record is…</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="recordType"
              value="seeking"
              checked={type === "seeking"}
              onChange={() => setType("seeking")}
              className="mt-1"
            />
            <span>
              <strong>I am looking for this person</strong>
              <br />
              <span className="text-sm text-muted">
                They are missing and I want to be contacted with information.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="recordType"
              value="info"
              checked={type === "info"}
              onChange={() => setType("info")}
              className="mt-1"
            />
            <span>
              <strong>I have information about this person</strong>
              <br />
              <span className="text-sm text-muted">
                I have seen them, or I know they are safe / injured / deceased.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="fullName" required error={err.fullName}>
          <input
            id="fullName"
            name="fullName"
            defaultValue={defaultName}
            required
            className={inputClass}
          />
        </Field>
        <Field
          label="Also known as / nickname"
          name="alsoKnownAs"
          error={err.alsoKnownAs}
        >
          <input id="alsoKnownAs" name="alsoKnownAs" className={inputClass} />
        </Field>

        <Field label="Age (years)" name="ageYears" error={err.ageYears}>
          <div className="flex items-center gap-3">
            <input
              id="ageYears"
              name="ageYears"
              type="number"
              min={0}
              max={130}
              className={inputClass}
            />
            <label className="flex shrink-0 items-center gap-1 text-sm text-muted">
              <input type="checkbox" name="ageIsApprox" value="on" /> approx.
            </label>
          </div>
        </Field>
        <Field label="Sex" name="sex" error={err.sex}>
          <select id="sex" name="sex" defaultValue="unknown" className={inputClass}>
            {SEXES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nationality" name="nationality" error={err.nationality}>
          <input
            id="nationality"
            name="nationality"
            placeholder="e.g. Nepal, India"
            className={inputClass}
          />
        </Field>
        <Field
          label="Home town / district"
          name="homeLocation"
          error={err.homeLocation}
        >
          <input id="homeLocation" name="homeLocation" className={inputClass} />
        </Field>

        <Field
          label="Last seen location"
          name="lastSeenLocation"
          error={err.lastSeenLocation}
        >
          <input
            id="lastSeenLocation"
            name="lastSeenLocation"
            placeholder="Village, ward, landmark, camp…"
            className={inputClass}
          />
        </Field>
        <Field label="Last seen date" name="lastSeenAt" error={err.lastSeenAt}>
          <input
            id="lastSeenAt"
            name="lastSeenAt"
            type="date"
            className={inputClass}
          />
        </Field>
      </div>

      {type === "info" && (
        <Field
          label="What do you know about them?"
          name="status"
          error={err.status}
          hint="Choose the status you can personally attest to."
        >
          <select id="status" name="status" defaultValue="seen_alive" className={inputClass}>
            {STATUSES.filter((s) => s !== "missing").map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field
        label="Description"
        name="description"
        error={err.description}
        hint="Clothing when last seen, height/build, distinguishing marks, medical needs. Do NOT put phone numbers or emails here — use the fields below."
      >
        <textarea
          id="description"
          name="description"
          rows={4}
          className={inputClass}
        />
      </Field>

      <Field
        label="Photo"
        name="photo"
        error={err.photo}
        hint="JPEG, PNG or WebP, up to 6 MB. Optional but helps recognition."
      >
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm"
        />
      </Field>

      <fieldset className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-medium">
          Your details (kept private)
        </legend>
        <p className="text-sm text-muted sm:col-span-2">
          Your phone and email are <strong>never shown publicly</strong>. They are
          used only so moderators can relay messages to you and so you can edit
          this record.
        </p>
        <Field label="Your name" name="authorName" required error={err.authorName}>
          <input
            id="authorName"
            name="authorName"
            required
            className={inputClass}
          />
        </Field>
        <Field
          label="Relationship to the person"
          name="authorRelation"
          error={err.authorRelation}
        >
          <input
            id="authorRelation"
            name="authorRelation"
            placeholder="e.g. daughter, friend, hospital staff"
            className={inputClass}
          />
        </Field>
        <Field label="Your email" name="authorEmail" error={err.authorEmail}>
          <input
            id="authorEmail"
            name="authorEmail"
            type="email"
            className={inputClass}
          />
        </Field>
        <Field label="Your phone" name="authorPhone" error={err.authorPhone}>
          <input id="authorPhone" name="authorPhone" className={inputClass} />
        </Field>
      </fieldset>

      {/* Honeypot: hidden from humans, tempting to bots. */}
      <div aria-hidden className="hidden">
        <label>
          Company website
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field label="" name="consent" error={err.consent}>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consent" value="on" className="mt-1" />
          <span>
            I have a legitimate reason to share this information, it is accurate to
            the best of my knowledge, and I understand it will be shown publicly to
            help locate this person. I can ask for it to be removed at any time.
          </span>
        </label>
      </Field>

      <SubmitButton pendingText="Submitting…">Submit record</SubmitButton>
    </form>
  );
}
