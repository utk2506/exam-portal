import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  block?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-teal-700",
  secondary: "bg-white text-ink ring-1 ring-stone-200 hover:bg-stone-50",
  ghost: "bg-transparent text-ink hover:bg-stone-100",
  danger: "bg-danger text-white hover:bg-rose-700"
};

export function Button({
  children,
  className,
  variant = "primary",
  block,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        block && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
