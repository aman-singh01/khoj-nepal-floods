import type { Metadata } from "next";
import { ReportForm } from "@/components/ReportForm";
import { Callout } from "@/components/Callout";

export const metadata: Metadata = { title: "Add a record" };

type SP = Record<string, string | string[] | undefined>;

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const typeParam = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  const nameParam = Array.isArray(sp.name) ? sp.name[0] : sp.name;
  const defaultType = typeParam === "info" ? "info" : "seeking";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Add a record</h1>

      <Callout tone="info">
        Only share information you have a genuine reason to share. This board is
        public. Do not post home addresses, ID numbers, or bank details. If the
        person is a child, only a parent, guardian, or a responder should create
        the record.
      </Callout>

      <ReportForm defaultType={defaultType} defaultName={nameParam ?? ""} />
    </div>
  );
}
