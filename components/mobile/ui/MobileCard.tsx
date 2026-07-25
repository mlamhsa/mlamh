import type {
    ComponentPropsWithoutRef,
    ElementType,
    ReactNode,
  } from "react";
  
  type MobileCardVariant = "default" | "soft" | "outlined" | "interactive";
  
  type MobileCardProps<T extends ElementType = "div"> = {
    as?: T;
    children: ReactNode;
    className?: string;
    variant?: MobileCardVariant;
    padding?: "none" | "small" | "medium" | "large";
  } & Omit<
    ComponentPropsWithoutRef<T>,
    "as" | "children" | "className"
  >;
  
  const variantClasses: Record<MobileCardVariant, string> = {
    default:
      "border border-white/10 bg-white/[0.045] shadow-sm shadow-black/20",
    soft:
      "border border-white/[0.06] bg-white/[0.025]",
    outlined:
      "border border-white/15 bg-transparent",
    interactive:
      "border border-white/10 bg-white/[0.045] shadow-sm shadow-black/20 transition duration-200 active:scale-[0.99] active:bg-white/[0.07]",
  };
  
  const paddingClasses = {
    none: "",
    small: "p-3",
    medium: "p-4",
    large: "p-5",
  };
  
  function mergeClasses(
    ...classes: Array<string | false | null | undefined>
  ) {
    return classes.filter(Boolean).join(" ");
  }
  
  export function MobileCard<T extends ElementType = "div">({
    as,
    children,
    className,
    variant = "default",
    padding = "medium",
    ...props
  }: MobileCardProps<T>) {
    const Component = as ?? "div";
  
    return (
      <Component
        className={mergeClasses(
          "overflow-hidden rounded-2xl",
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }