import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  highlighted?: boolean;
};

export function Card({
  children,
  highlighted = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <section
      {...props}
      className={`
rounded-[2rem]
border
${
  highlighted
    ? "border-gold/20 bg-gold/[0.04]"
    : "border-white/10 bg-white/[0.035]"
}
${className}
`}
    >
      {children}
    </section>
  );
}