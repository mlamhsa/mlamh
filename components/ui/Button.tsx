import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "gold"
  | "outline"
  | "danger"
  | "ghost"
  | "success";

type ButtonSize = "sm" | "md" | "lg";

type BaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonProps =
  | (BaseProps &
      ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: never;
      })
  | (BaseProps & {
      href: string;
    });

const variants: Record<ButtonVariant, string> = {
  gold:
    "border-gold bg-gold text-black hover:bg-[#e0bd73] hover:border-[#e0bd73]",

  outline:
    "border-white/15 text-white/70 hover:border-gold/40 hover:text-gold",

  danger:
    "border-red-400/40 bg-red-400/[0.05] text-red-300 hover:bg-red-400 hover:text-black",

  success:
    "border-emerald-400/40 bg-emerald-400/[0.06] text-emerald-300 hover:bg-emerald-400 hover:text-black",

  ghost:
    "border-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.03] hover:text-white",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-[11px]",
  md: "px-5 py-3 text-xs",
  lg: "px-6 py-4 text-sm",
};

export function Button({
  children,
  variant = "outline",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const classes = `
inline-flex
items-center
justify-center
gap-2
rounded-full
border
font-medium
uppercase
tracking-[0.2em]
transition
${variants[variant]}
${sizes[size]}
${className}
`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}