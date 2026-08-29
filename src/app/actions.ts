"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { persons } from "@/db/schema";
import {
  personInput,
  noteInput,
  reportInput,
  contactInput,
} from "@/lib/validation";
import {
  formToObject,
  requestIpHash,
  fieldErrors,
  type ActionState,
} from "@/lib/forms";
import { isBotSubmission } from "@/lib/safety";
import { checkRateLimit } from "@/lib/ratelimit";
import { storePhoto, PhotoError } from "@/lib/storage";
import { MOD_COOKIE, tokenValid, isModerator } from "@/lib/moderation-auth";
import * as repo from "@/lib/repo";

const RATE_MSG =
  "You have sent several submissions in a short time. Please wait a few minutes and try again.";

function editCookieName(id: string) {
  return `khoj_edit_${id}`;
}

// --- Public submissions -----------------------------------------------------

export async function submitPerson(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (isBotSubmission(formData)) {
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  const ipHash = await requestIpHash();
  const rate = await checkRateLimit("person", ipHash);
  if (!rate.ok) return { ok: false, message: RATE_MSG };

  const parsed = personInput.safeParse(formToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const { id, editToken, held } = await repo.createPerson(parsed.data, { ipHash });

  let photoNote = "";
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      const stored = await storePhoto(photo);
      await repo.attachPhoto(id, stored.url);
    } catch (err) {
      photoNote =
        err instanceof PhotoError
          ? ` (The photo was not saved: ${err.message})`
          : " (The photo could not be saved.)";
    }
  }

  const jar = await cookies();
  jar.set(editCookieName(id), editToken, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/");
  revalidatePath("/persons");

  const suffix = held ? "&pending=1" : "";
  redirect(`/persons/${id}?created=1${suffix}${photoNote ? "&photo=err" : ""}`);
}

export async function submitNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (isBotSubmission(formData)) {
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  const ipHash = await requestIpHash();
  const rate = await checkRateLimit("note", ipHash);
  if (!rate.ok) return { ok: false, message: RATE_MSG };

  const parsed = noteInput.safeParse(formToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const { held } = await repo.addNote(parsed.data, { ipHash });
  revalidatePath(`/persons/${parsed.data.personId}`);

  return {
    ok: true,
    message: held
      ? "Thank you. Your update will be published once a moderator has reviewed it."
      : "Your update has been added.",
  };
}

export async function submitReport(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ipHash = await requestIpHash();
  const rate = await checkRateLimit("report", ipHash);
  if (!rate.ok) return { ok: false, message: RATE_MSG };

  const parsed = reportInput.safeParse(formToObject(formData));
  if (!parsed.success || (!parsed.data.personId && !parsed.data.noteId)) {
    return { ok: false, message: "Please choose a reason for the report." };
  }

  await repo.fileReport({
    personId: parsed.data.personId,
    noteId: parsed.data.noteId,
    reason: parsed.data.reason,
    detail: parsed.data.detail,
    ipHash,
  });

  if (parsed.data.personId) revalidatePath(`/persons/${parsed.data.personId}`);
  return {
    ok: true,
    message: "Thank you. A moderator will review this record.",
  };
}

export async function submitContact(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (isBotSubmission(formData)) {
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  const ipHash = await requestIpHash();
  const rate = await checkRateLimit("message", ipHash);
  if (!rate.ok) return { ok: false, message: RATE_MSG };

  const parsed = contactInput.safeParse(formToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  await repo.sendContactMessage({ ...parsed.data, ipHash });
  return {
    ok: true,
    message:
      "Message received. If the person who posted this record left contact details, a moderator will pass your message on. We never share their details publicly.",
  };
}

export async function removeOwnPerson(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("personId") ?? "");
  if (!id) return { ok: false, message: "Missing record id." };

  const db = await getDb();
  const jar = await cookies();
  const token = jar.get(editCookieName(id))?.value;
  const [row] = await db
    .select({ editToken: persons.editToken })
    .from(persons)
    .where(eq(persons.id, id))
    .limit(1);

  if (!row || !token || token !== row.editToken) {
    return { ok: false, message: "This record can only be removed from the device that created it." };
  }

  await repo.setPersonModeration(id, "hidden");
  revalidatePath("/");
  revalidatePath("/persons");
  return { ok: true, message: "Your record has been removed from public view." };
}

// --- Moderator -------------------------------------------------------------

export async function moderatorLogin(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  if (!tokenValid(token)) {
    return { ok: false, message: "Incorrect moderator token." };
  }
  const jar = await cookies();
  jar.set(MOD_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/moderation");
}

export async function moderatorLogout(): Promise<void> {
  const jar = await cookies();
  jar.delete(MOD_COOKIE);
  redirect("/");
}

export async function moderate(formData: FormData): Promise<void> {
  if (!(await isModerator())) return;

  const op = String(formData.get("op") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  switch (op) {
    case "person_publish":
      await repo.setPersonModeration(id, "published");
      break;
    case "person_hide":
      await repo.setPersonModeration(id, "hidden");
      break;
    case "note_publish":
      await repo.setNoteModeration(id, "published");
      break;
    case "note_hide":
      await repo.setNoteModeration(id, "hidden");
      break;
    case "report_resolve":
      await repo.resolveReport(id);
      break;
    case "update_pin":
      await repo.setUpdateFlags(id, { pinned: true, hidden: false });
      break;
    case "update_unpin":
      await repo.setUpdateFlags(id, { pinned: false });
      break;
    case "update_hide":
      await repo.setUpdateFlags(id, { hidden: true, pinned: false });
      break;
    case "update_show":
      await repo.setUpdateFlags(id, { hidden: false });
      break;
  }

  revalidatePath("/moderation");
  revalidatePath("/updates");
  revalidatePath("/");
}
