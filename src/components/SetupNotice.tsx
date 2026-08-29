import { Callout } from "./Callout";

/** Shown when a DB query fails - almost always "migration not run yet". */
export function SetupNotice({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    <Callout tone="warn" title="Database not ready">
      <p className="mb-2">
        A database query failed. If this is a fresh checkout, apply the schema:
      </p>
      <pre className="overflow-x-auto rounded bg-black/10 p-2 text-xs dark:bg-white/10">
        npm run db:migrate
      </pre>
      <p className="mt-2 text-xs opacity-80">{msg}</p>
    </Callout>
  );
}
