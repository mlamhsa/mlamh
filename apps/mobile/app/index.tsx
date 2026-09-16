import { useEffect } from "react";

import { RootRouteGate } from "@/src/navigation/RootRouteGate";

export default function IndexScreen() {
  useEffect(() => {
    console.log("[MLAMH_LAUNCH] root-route-mounted");
  }, []);

  return <RootRouteGate />;
}
