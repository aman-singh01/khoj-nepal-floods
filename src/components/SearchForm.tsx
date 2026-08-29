import { STATUS_LABELS } from "@/lib/validation";

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="h-5 w-5 text-muted"
    >
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
      <path
        d="m14 14 4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
          ? "flex flex-wrap items-end gap-2"
          : "card grid gap-3 p-4 sm:p-5"
      }
    >
      <div className={compact ? "min-w-[12rem] flex-1" : "sm:col-span-2"}>
        <label htmlFor="q" className="sr-only">
          Name
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
            <SearchIcon />
          </span>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={defaults?.q ?? ""}
            placeholder="Search by name — any spelling"
            className="field py-3 pl-11 text-base"
            autoComplete="off"
          />
        </div>
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <div className="min-w-[9rem] flex-1">
            <label htmlFor="status" className="mb-1 block text-xs font-medium text-muted">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={defaults?.status ?? ""}
              className="field"
            >
              <option value="">Any</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[9rem] flex-1">
            <label
              htmlFor="nationality"
              className="mb-1 block text-xs font-medium text-muted"
            >
              Nationality
            </label>
            <input
              id="nationality"
              name="nationality"
              defaultValue={defaults?.nationality ?? ""}
              placeholder="e.g. India, Nepal"
              className="field"
            />
          </div>
        </div>
      )}

      <button type="submit" className={`btn-primary ${compact ? "" : "sm:col-span-2"}`}>
        Search records
      </button>
    </form>
  );
}
