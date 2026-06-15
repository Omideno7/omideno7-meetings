import { useEffect, useState } from "react";

export function useDemoStoreVersion() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion((value) => value + 1);
    window.addEventListener("omideno7-demo-store-updated", handler);
    return () => window.removeEventListener("omideno7-demo-store-updated", handler);
  }, []);

  return version;
}
