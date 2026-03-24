"use client";

import { cn } from "@/lib/utils";
import React, { type ButtonHTMLAttributes } from "react";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const variants = {
  primary:
    "bg-[var(--accent-strong)] text-surface shadow-[0_20px_60px_rgba(77,234,194,0.35)] hover:-translate-y-0.5 hover:shadow-[0_25px_70px_rgba(77,234,194,0.45)] focus-visible:outline-[var(--accent-strong)]",
  secondary:
    "bg-white/5 text-white border border-white/15 hover:bg-white/10 focus-visible:outline-white/70",
  ghost:
    "text-[var(--muted)] hover:text-white hover:bg-white/5",
} as const;

const sizes = {
  base: "h-11",
  lg: "h-12 px-6 text-base",
  sm: "h-9 px-4 text-xs",
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "base",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const computedClass = cn(baseStyles, variants[variant], sizes[size], className);

  if (asChild && React.isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn(computedClass, (children.props as { className?: string }).className),
      ...props,
    });
  }

  return (
    <button className={computedClass} {...props}>
      {children}
    </button>
  );
}
