import type {
    ButtonHTMLAttributes,
    ReactNode,
  } from "react";
  
  type MobileButtonVariant =
    | "primary"
    | "secondary"
    | "ghost"
    | "danger";
  
  type MobileButtonSize = "small" | "medium" | "large";
  
  type MobileButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: MobileButtonVariant;
    size?: MobileButtonSize;
    fullWidth?: boolean;
    loading?: boolean;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
  };
  
  const variantClasses: Record<MobileButtonVariant, string> = {
    primary:
      "border border-gold bg-gold text-black hover:bg-gold/90",
    secondary:
      "border border-white/15 bg-white/[0.05] text-white hover:bg-white/[0.08]",
    ghost:
      "border border-transparent bg-transparent text-white/75 hover:bg-white/[0.05] hover:text-white",
    danger:
      "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15",
  };
  
  const sizeClasses: Record<MobileButtonSize, string> = {
    small: "min-h-11 rounded-xl px-4 text-sm",
    medium: "min-h-12 rounded-2xl px-5 text-sm",
    large: "min-h-13 rounded-2xl px-6 text-base",
  };
  
  function mergeClasses(
    ...classes: Array<string | false | null | undefined>
  ) {
    return classes.filter(Boolean).join(" ");
  }
  
  export function MobileButton({
    children,
    variant = "primary",
    size = "medium",
    fullWidth = false,
    loading = false,
    leadingIcon,
    trailingIcon,
    disabled,
    className,
    type = "button",
    ...props
  }: MobileButtonProps) {
    const isDisabled = disabled || loading;
  
    return (
      <button
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={mergeClasses(
          "inline-flex items-center justify-center gap-2 font-medium transition duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "active:scale-[0.98]",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          leadingIcon
        )}
  
        <span>{children}</span>
  
        {!loading ? trailingIcon : null}
      </button>
    );
  }