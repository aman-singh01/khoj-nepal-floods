import { STATUS_LABELS } from "@/lib/validation";

/**
 * Plain GET form - no JavaScript required, shareable/bookmarkable result URLs,
 * and it works on the slowest connection.
 */
export function SearchForm({
  defaults,
  compact = false,
}: {
  defaults?: { q?: string; status?: string; nationality?: string };
  compact?: boolean;
}) {
  return (
    <form
      action="/persons"
      method="get"
      className={
        compact
          ? "flex flex-wrap gap-2"
          : "grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_auto]"
      }
    >
      <div className={compact ? "flex-1 min-w-[12rem]" : ""}>
        <label htmlFor="q" className="sr-only">
          Name
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaults?.q ?? ""}
          placeholder="Name (any spelling)"
          className="w-full rounded-md border border-border bg-bg px-3 py-2"
          autoComplete="off"
        />
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <div>
            <label htmlFor="status" className="mb-1 block text-sm text-muted">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={defaults?.status ?? ""}
              className="rounded-md border border-border bg-bg px-3 py-2"
            >
              <option value="">Any</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nationality" className="mb-1 block text-sm text-muted">
              Nationality
            </label>
            <input
              id="nationality"
              name="nationality"
              defaultValue={defaults?.nationality ?? ""}
              placeholder="e.g. India, Nepal"
              className="rounded-md border border-border bg-bg px-3 py-2"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        className="rounded-md bg-accent px-4 py-2 font-medium text-accent-fg hover:opacity-90"
      >
        Search
      </button>
    </form>
  );
}
