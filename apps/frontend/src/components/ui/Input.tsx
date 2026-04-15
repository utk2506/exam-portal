import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "../../lib/cn";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border px-3 py-2 text-sm outline-none transition",
        "border-stone-200 bg-white text-ink focus:border-primary focus:ring-2 focus:ring-teal-200",
        props.className
      )}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-200",
        props.className
      )}
    />
  );
}
