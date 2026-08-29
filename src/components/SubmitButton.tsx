"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "rounded-md bg-accent px-4 py-2 font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
      }
    >
      {pending ? (pendingText ?? "Working…") : children}
    </button>
  );
}
