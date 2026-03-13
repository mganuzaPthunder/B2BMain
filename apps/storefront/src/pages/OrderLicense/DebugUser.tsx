import { useEffect } from "react";
import { useAppSelector } from "@/store";

export default function DebugUser() {
  const state = useAppSelector((s) => s);

  useEffect(() => {
    console.log("🧭 Redux State Snapshot:", state);
  }, [state]);

  return null; // nothing rendered, just logs once
}
