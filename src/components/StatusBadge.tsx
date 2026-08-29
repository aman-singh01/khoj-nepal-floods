import { STATUS_CLASSES, STATUS_LABELS } from "@/lib/ui";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_CLASSES[status] ?? STATUS_CLASSES.unknown
      }`}
    >
      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
    </span>
  );
}
