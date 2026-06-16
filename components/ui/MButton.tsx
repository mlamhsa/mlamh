import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonStyle, cardStyle } from "@/styles/design-system";

type ButtonVariant = keyof typeof buttonStyle;

type MButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function MButton({
  variant = "primary",
  children,
  className = "",
  ...props
}: MButtonProps) {
  return (
    <button
      className={`${buttonStyle[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function MCard({ children }: { children: ReactNode }) {
  return <div className={cardStyle}>{children}</div>;
}