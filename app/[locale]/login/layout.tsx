export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="login-route-shell">
      <style>{`
        @media (max-width: 1023px) {
          .login-route-shell > main {
            min-height: calc(100dvh - 4rem) !important;
            align-items: flex-start !important;
            padding: 1.25rem 1rem 2rem !important;
          }

          .login-route-shell > main > div:nth-of-type(2) {
            margin-top: 0.5rem;
            padding: 1.25rem !important;
            border-radius: 1.75rem !important;
          }

          .login-route-shell > main > div:nth-of-type(2) > div:first-child {
            margin-bottom: 1.5rem !important;
          }

          .login-route-shell > main h1 {
            font-size: 2rem !important;
            line-height: 1.25 !important;
          }

          .login-route-shell > main form input {
            min-height: 3.5rem;
          }
        }

        @media (max-width: 390px), (max-height: 760px) {
          .login-route-shell > main {
            padding-top: 0.75rem !important;
          }

          .login-route-shell > main > div:nth-of-type(2) {
            margin-top: 0;
            padding: 1rem !important;
          }

          .login-route-shell > main > div:nth-of-type(2) > div:first-child {
            margin-bottom: 1.15rem !important;
          }

          .login-route-shell > main h1 {
            font-size: 1.8rem !important;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
