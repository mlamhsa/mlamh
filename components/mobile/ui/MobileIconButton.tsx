import type {
    ButtonHTMLAttributes,
    ReactNode,
  } from "react";
  
  type MobileIconButtonVariant =
    | "default"
    | "ghost"
    | "gold"
    | "danger";
  
  type MobileIconButtonSize = "small" | "medium" | "large";
  
  type MobileIconButtonProps =
    ButtonHTMLAttributes<HTMLButtonElement> & {
      label: string;
      icon: ReactNode;
      variant?: MobileIconButtonVariant;
      size?: MobileIconButtonSize;
      active?: boolean;
    };
  
  const variantClasses: Record<MobileIconButtonVariant, string> = {
    default:
      "border border-white/10 bg-white/[0.05] text-white/75 hover:bg-white/[0.08] hover:text-white",
    ghost:
      "border border-transparent bg-transparent text-white/65 hover:bg-white/[0.05] hover:text-white",
    gold:
      "border border-gold/30 bg-gold/10 text-gold hover:bg-gold/15",
    danger:
      "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15",
  };
  
  const sizeClasses: Record<MobileIconButtonSize, string> = {
    small: "h-11 w-11 rounded-xl",
    medium: "h-12 w-12 rounded-2xl",
    large: "h-13 w-13 rounded-2xl",
  };
  
  function mergeClasses(
    ...classes: Array<string | false | null | undefined>
  ) {
    return classes.filter(Boolean).join(" ");
  }
  
  export function MobileIconButton({
    label,
    icon,
    variant = "default",
    size = "medium",
    active = false,
    className,
    type = "button",
    ...props
  }: MobileIconButtonProps) {
    return (
      <button
        type={type}
        aria-label={label}
        aria-pressed={active || undefined}
        className={mergeClasses(
          "inline-flex shrink-0 items-center justify-center transition duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "active:scale-95",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          active && "border-gold/40 bg-gold/15 text-gold",
          className
        )}
        {...props}
      >
        {icon}
      </button>
    );
  }