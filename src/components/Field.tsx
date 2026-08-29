import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

interface ControlProps {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/**
 * Label + control wrapper. Associates the label with the control and wires up
 * `aria-describedby` / `aria-invalid` by cloning the child, so callers only pass
 * a `name` and don't have to repeat `id` everywhere.
 */
export function Field({
  label,
  name,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const isFormControl =
    isValidElement(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type);

  const control =
    isFormControl && isValidElement<ControlProps>(children)
      ? cloneElement(children as ReactElement<ControlProps>, {
          id: children.props.id ?? name,
          "aria-describedby": children.props["aria-describedby"] ?? describedBy,
          "aria-invalid": error ? true : children.props["aria-invalid"],
        })
      : children;

  return (
    <div>
      {label && (
        <label htmlFor={name} className="mb-1.5 block text-sm font-medium">
          {label}
          {required && (
            <span className="text-rose-600 dark:text-rose-400" aria-hidden>
              {" "}
              *
            </span>
          )}
        </label>
      )}
      {hint && (
        <p id={hintId} className="mb-1.5 text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {control}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

/** Shared input styling. `.field` is defined in globals.css. */
export const inputClass = "field";
