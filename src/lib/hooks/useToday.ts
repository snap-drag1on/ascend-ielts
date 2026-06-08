import { useEffect, useState } from "react";

/** Returns the current YYYY-MM-DD key, updating at midnight. */
export function useToday(): string {
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = new Date().toISOString().slice(0, 10);
      setToday((prev) => (prev === next ? prev : next));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return today;
}
