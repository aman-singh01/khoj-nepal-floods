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
    <button type="submit" disabled={pending} className={className ?? "btn-primary"}>
      {pending && (
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4 animate-spin"
          aria-hidden
          fill="none"
        >
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" opacity="0.25" />
          <path d="M10 3a7 7 0 0 1 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      {pending ? (pendingText ?? "Working…") : children}
    </button>
  );
}
