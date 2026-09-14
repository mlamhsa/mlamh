import type { ReactNode } from "react";

type JoinLayoutProps = {
  children: ReactNode;
};

export default function JoinLayout({ children }: JoinLayoutProps) {
  return (
    <div className="join-mobile-refine">
      {children}
      <style>{`
        @media (max-width: 639px) {
          .join-mobile-refine section:has(form) {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
            padding-top: 5.5rem !important;
            padding-bottom: 8.5rem !important;
          }

          .join-mobile-refine div:has(> form) {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
            border-radius: 1.25rem !important;
          }

          .join-mobile-refine form > * + * {
            margin-top: 1rem !important;
          }

          .join-mobile-refine form > .grid {
            gap: 0.875rem !important;
          }

          .join-mobile-refine form input:not([type="checkbox"]),
          .join-mobile-refine form select,
          .join-mobile-refine form #signup-nationality-trigger,
          .join-mobile-refine form #signup-city-trigger,
          .join-mobile-refine form #signup-gender-trigger,
          .join-mobile-refine form #signup-talent-type-trigger {
            min-height: 3rem !important;
            border-radius: 0.875rem !important;
          }

          .join-mobile-refine form #signup-nationality-trigger,
          .join-mobile-refine form #signup-city-trigger,
          .join-mobile-refine form #signup-gender-trigger,
          .join-mobile-refine form #signup-talent-type-trigger {
            padding-top: 0.625rem !important;
            padding-bottom: 0.625rem !important;
          }

          .join-mobile-refine form div[dir="ltr"] {
            grid-template-columns: 5.5rem minmax(0, 1fr) !important;
          }

          .join-mobile-refine form div[dir="ltr"] > div {
            min-height: 3rem !important;
            border-radius: 0.875rem !important;
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }

          .join-mobile-refine form label > span,
          .join-mobile-refine form div.block > span {
            margin-bottom: 0.375rem !important;
          }

          .join-mobile-refine form > p {
            padding: 0.75rem !important;
            border-radius: 0.875rem !important;
            line-height: 1.65 !important;
          }

          .join-mobile-refine form > label:has(input[type="checkbox"]) {
            gap: 0.75rem !important;
            padding: 0.75rem !important;
            border-radius: 0.875rem !important;
          }

          .join-mobile-refine form input[type="checkbox"] {
            width: 1.25rem !important;
            height: 1.25rem !important;
            flex: 0 0 auto;
          }

          .join-mobile-refine form > button[type="submit"] {
            min-height: 3.125rem !important;
            border-radius: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
