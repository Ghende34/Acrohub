"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readWatch, writeWatch, type WatchAlert, type WatchList } from "@/lib/watch-client";
import type { WatchContest, WatchPilot } from "@/lib/watch";

const INTERVAL_MS = 10 * 60 * 1000;

export function WatchManager() {
  const [alerts, setAlerts] = useState<WatchAlert[]>([]);

  useEffect(() => {
    const show = () => setAlerts(readWatch().alerts.slice(0, 3));
    show();
    window.addEventListener("acrohub-watch", show);
    const timer = window.setInterval(() => void checkWatch(), INTERVAL_MS);
    void checkWatch();
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkWatch();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("acrohub-watch", show);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (alerts.length === 0) return null;
  return (
    <div className="watch-banner wrap">
      <p>
        <Link href="/watch">{alerts[0]?.message}</Link>
        {alerts.length > 1 ? <span className="meta">{` · ${alerts.length - 1} more on your watch list`}</span> : null}
      </p>
    </div>
  );
}

let checking = false;
let lastCheck = 0;

async function checkWatch() {
  if (checking || Date.now() - lastCheck < 60_000) return;
  const list = readWatch();
  if (list.contests.length === 0 && list.pilots.length === 0) return;
  checking = true;
  lastCheck = Date.now();
  try {
    const params = new URLSearchParams();
    if (list.contests.length) params.set("contests", list.contests.map((item) => item.id).join(","));
    if (list.pilots.length) params.set("pilots", list.pilots.map((item) => item.id).join(","));
    const response = await fetch(`/api/watch?${params}`, { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as { contests: WatchContest[]; pilots: WatchPilot[] };
    const created = applySnapshots(list, body.contests, body.pilots);
    writeWatch(list);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      for (const alert of created) new Notification("Acrohub", { body: alert.message });
    }
  } catch {
    /* The next visit tries again. */
  } finally {
    checking = false;
  }
}

function applySnapshots(list: WatchList, contests: WatchContest[], pilots: WatchPilot[]): WatchAlert[] {
  const created: WatchAlert[] = [];
  for (const contest of contests) {
    const key = String(contest.id);
    const previous = list.snapshots.contests[key];
    list.snapshots.contests[key] = contest.signature;
    if (previous && previous !== contest.signature) {
      created.push({
        at: new Date().toISOString(),
        href: `/contests/${contest.id}`,
        message: `${contest.name} results changed.`,
      });
    }
  }
  for (const pilot of pilots) {
    const key = String(pilot.id);
    const previous = list.snapshots.pilots[key];
    list.snapshots.pilots[key] = pilot.signature;
    if (previous && previous !== pilot.signature) {
      created.push({
        at: new Date().toISOString(),
        href: `/pilots/${pilot.id}`,
        message: `${pilot.name} has a new or updated result${pilot.latest ? `: ${pilot.latest}` : ""}.`,
      });
    }
  }
  list.notified = true;
  list.alerts = [...created, ...list.alerts].slice(0, 30);
  return created;
}
