import type { ReactNode } from "react";

type Props = {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  label: string;
  disabled?: boolean;
};

export function ToolButton({ active, onClick, children, label, disabled }: Props) {
  return (
    <button
      type="button"
      className={active ? "tool-btn active" : "tool-btn"}
      onClick={onClick}
      aria-label={label}
      aria-pressed={!!active}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
