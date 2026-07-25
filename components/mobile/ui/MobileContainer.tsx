import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type MobileContainerProps<T extends ElementType = "div"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  withBottomNavigationSpace?: boolean;
} & Omit<
  ComponentPropsWithoutRef<T>,
  "as" | "children" | "className"
>;

function mergeClasses(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}

export function MobileContainer<T extends ElementType = "div">({
  as,
  children,
  className,
  withBottomNavigationSpace = true,
  ...props
}: MobileContainerProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={mergeClasses(
        "mx-auto w-full max-w-screen-sm px-4 sm:px-5 lg:max-w-none lg:px-0",
        withBottomNavigationSpace &&
          "pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}