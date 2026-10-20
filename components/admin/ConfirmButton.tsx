"use client";

import type { ButtonHTMLAttributes } from "react";

/**
 * A button that asks before it acts, for anything that can't be undone.
 * Without onConfirm it submits its form once confirmed; with it, the click
 * never does anything by default (so it is safe inside a <summary>) and
 * onConfirm runs instead.
 */
export function ConfirmButton({
  message,
  onConfirm,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { message: string; onConfirm?: () => void }) {
  return (
    <button
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (onConfirm) e.preventDefault();
        if (!confirm(message)) {
          e.preventDefault();
          return;
        }
        onConfirm?.();
      }}
    />
  );
}
