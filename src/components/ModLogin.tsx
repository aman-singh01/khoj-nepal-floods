"use client";

import { useActionState } from "react";
import { moderatorLogin } from "@/app/actions";
import type { ActionState } from "@/lib/forms";
import { Callout } from "./Callout";
import { SubmitButton } from "./SubmitButton";
import { inputClass } from "./Field";

const initial: ActionState = { ok: false };

export function ModLogin() {
  const [state, action] = useActionState(moderatorLogin, initial);
  return (
    <form action={action} className="max-w-sm space-y-3">
      {state.message && <Callout tone="danger">{state.message}</Callout>}
      <label htmlFor="token" className="block text-sm font-medium">
        Moderator token
      </label>
      <input
        id="token"
        name="token"
        type="password"
        autoComplete="off"
        className={inputClass}
      />
      <SubmitButton pendingText="Checking…">Sign in</SubmitButton>
    </form>
  );
}
