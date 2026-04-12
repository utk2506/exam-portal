import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "../../lib/cn";

export function Card({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn("rounded-3xl border border-stone-200/70 bg-white/90 p-6 shadow-card backdrop-blur", className)}
      {...props}
    >
      {children}
    </div>
  );
}
