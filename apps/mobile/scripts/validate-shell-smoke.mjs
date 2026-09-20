import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const gate = read("src/navigation/RootRouteGate.tsx");
const chrome = read("src/navigation/NativeAppChrome.tsx");
const login = read("app/login.tsx");

const checks = [
  [
    "account_missing cold launch keeps public home",
    /session\.status === "account_missing"[\s\S]{0,500}ROUTES\.public/.test(gate),
  ],
  [
    "account-type keeps bottom navigation",
    !/HIDE_BOTTOM[^\n]*"\/account-type"/.test(chrome),
  ],
  [
    "guest shell contains public home",
    /href: "\/public-home"/.test(chrome),
  ],
  [
    "guest shell contains login",
    /href: "\/login"/.test(chrome),
  ],
  [
    "Google sign-in is wired on login",
    /signInWithNativeGoogle/.test(login) && /handleGoogleSignIn/.test(login),
  ],
  [
    "Apple sign-in is wired on login",
    /AppleAuthenticationButton/.test(login) && /signInWithNativeApple/.test(login),
  ],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failed = true;
}

if (failed) {
  console.error("Mobile shell smoke gate failed.");
  process.exit(1);
}

console.log("Mobile shell smoke gate passed.");
