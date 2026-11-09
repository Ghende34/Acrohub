"use client";

import { useEffect, useState } from "react";
import { readWatch, toggleContest, togglePilot } from "@/lib/watch-client";

export function WatchButton({
  kind,
  id,
  name,
}: {
  kind: "contest" | "pilot";
  id: number;
  name: string;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => {
      const list = readWatch();
      setOn(kind === "contest" ? list.contests.some((item) => item.id === id) : list.pilots.some((item) => item.id === id));
    };
    sync();
    window.addEventListener("acrohub-watch", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("acrohub-watch", sync);
      window.removeEventListener("storage", sync);
    };
  }, [id, kind]);

  return (
    <button
      type="button"
      className={on ? "chip is-on" : "chip"}
      aria-pressed={on}
      onClick={() => {
        const watching = kind === "contest" ? toggleContest({ id, name }) : togglePilot({ id, name });
        setOn(watching);
      }}
    >
      {on ? "Watching" : kind === "contest" ? "Watch contest" : "Watch pilot"}
    </button>
  );
}
