"use client";

import { useActionState, useState } from "react";
import {
  submitNote,
  submitContact,
  submitReport,
  removeOwnPerson,
} from "@/app/actions";
import type { ActionState } from "@/lib/forms";
import { Field, inputClass } from "./Field";
import { Callout } from "./Callout";
import { SubmitButton } from "./SubmitButton";
import { STATUSES, STATUS_LABELS, REPORT_REASONS, REASON_LABELS } from "@/lib/validation";

const initial: ActionState = { ok: false };

function Honeypot() {
  return (
    <div aria-hidden className="hidden">
      <label>
        Company website
        <input name="company_website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

function Result({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <Callout tone={state.ok ? "success" : "danger"}>{state.message}</Callout>
  );
}

export function AddNoteForm({ personId }: { personId: string }) {
  const [state, action] = useActionState(submitNote, initial);
  const err = state.errors ?? {};

  if (state.ok) return <Result state={state} />;

  return (
    <form action={action} className="space-y-4">
      <Result state={state} />
      <input type="hidden" name="personId" value={personId} />

      <Field label="Type of update" name="noteType">
        <select name="noteType" defaultValue="sighting" className={inputClass}>
          <option value="sighting">I saw this person</option>
          <option value="status_update">Update on their situation</option>
          <option value="general">General information</option>
        </select>
      </Field>

      <Field
        label="What do you know?"
        name="text"
        required
        error={err.text}
        hint="Where, when, and any detail that helps confirm it is the same person."
      >
        <textarea name="text" rows={3} required className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Their status now" name="statusReported">
          <select name="statusReported" defaultValue="" className={inputClass}>
            <option value="">Don&apos;t change / unsure</option>
            {STATUSES.filter((s) => s !== "missing").map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location" name="lastKnownLocation" error={err.lastKnownLocation}>
          <input name="lastKnownLocation" className={inputClass} />
        </Field>
        <Field label="Your name" name="authorName" required error={err.authorName}>
          <input name="authorName" required className={inputClass} />
        </Field>
        <Field label="Your relationship / role" name="authorRelation">
          <input
            name="authorRelation"
            placeholder="e.g. neighbour, nurse, volunteer"
            className={inputClass}
          />
        </Field>
        <Field label="Your email (private)" name="authorEmail" error={err.authorEmail}>
          <input name="authorEmail" type="email" className={inputClass} />
        </Field>
        <Field label="Your phone (private)" name="authorPhone">
          <input name="authorPhone" className={inputClass} />
        </Field>
      </div>

      <Honeypot />
      <SubmitButton pendingText="Posting…">Post update</SubmitButton>
    </form>
  );
}

export function ContactForm({ personId }: { personId: string }) {
  const [state, action] = useActionState(submitContact, initial);
  const err = state.errors ?? {};

  return (
    <form action={action} className="space-y-4">
      <Result state={state} />
      {!state.ok && (
        <>
          <input type="hidden" name="personId" value={personId} />
          <p className="text-sm text-muted">
            Your message goes to a moderator, who will pass it to the person who
            posted this record if they left contact details. Their details are
            never shown to you.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" name="fromName" required error={err.fromName}>
              <input name="fromName" required className={inputClass} />
            </Field>
            <Field
              label="How to reach you"
              name="fromContact"
              required
              error={err.fromContact}
              hint="Phone or email"
            >
              <input name="fromContact" required className={inputClass} />
            </Field>
          </div>
          <Field label="Message" name="message" required error={err.message}>
            <textarea name="message" rows={3} required className={inputClass} />
          </Field>
          <Honeypot />
          <SubmitButton pendingText="Sending…">Send message</SubmitButton>
        </>
      )}
    </form>
  );
}

export function ReportRecordForm({ personId }: { personId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(submitReport, initial);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted underline hover:text-text"
      >
        Report this record (scam, fake, privacy concern…)
      </button>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-lg border border-border p-4">
      <Result state={state} />
      {!state.ok && (
        <>
          <input type="hidden" name="personId" value={personId} />
          <Field label="Reason" name="reason">
            <select name="reason" defaultValue="scam_or_fraud" className={inputClass}>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Details (optional)" name="detail">
            <textarea name="detail" rows={2} className={inputClass} />
          </Field>
          <div className="flex gap-2">
            <SubmitButton pendingText="Sending…">Send report</SubmitButton>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </form>
  );
}

export function RemoveRecordForm({ personId }: { personId: string }) {
  const [state, action] = useActionState(removeOwnPerson, initial);
  return (
    <form action={action} className="space-y-2">
      <Result state={state} />
      {!state.ok && (
        <>
          <input type="hidden" name="personId" value={personId} />
          <SubmitButton
            pendingText="Removing…"
            className="rounded-md border border-rose-400 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            Remove this record from public view
          </SubmitButton>
        </>
      )}
    </form>
  );
}
