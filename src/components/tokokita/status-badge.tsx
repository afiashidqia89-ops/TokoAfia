"use client";

import type { StatusPO } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<StatusPO, string> = {
  menunggu: "bg-amber-100 text-amber-700",
  diproses: "bg-violet-100 text-violet-700",
  selesai: "bg-emerald-100 text-emerald-700",
  dibatalkan: "bg-rose-100 text-rose-600",
};

const DOT_STYLE: Record<StatusPO, string> = {
  menunggu: "bg-amber-500",
  diproses: "bg-violet-500",
  selesai: "bg-emerald-500",
  dibatalkan: "bg-rose-500",
};

export function StatusBadge({
  status,
  className,
}: {
  status: StatusPO;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_STYLE[status],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLE[status])} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}
