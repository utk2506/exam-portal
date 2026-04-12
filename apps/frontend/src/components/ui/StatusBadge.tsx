import { cn } from "../../lib/cn";

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "danger" | "warning" | "info" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
        tone === "neutral" && "bg-stone-100 text-stone-700",
        tone === "success" && "bg-teal-100 text-teal-800",
        tone === "danger" && "bg-rose-100 text-rose-800",
        tone === "warning" && "bg-amber-100 text-amber-800",
        tone === "info" && "bg-sky-100 text-sky-800"
      )}
    >
      {label}
    </span>
  );
}
