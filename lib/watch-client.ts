"use client";

export type SavedContest = { id: number; name: string };
export type SavedPilot = { id: number; name: string };
export type WatchAlert = { at: string; message: string; href: string };

export type WatchList = {
  contests: SavedContest[];
  pilots: SavedPilot[];
  snapshots: { contests: Record<string, string>; pilots: Record<string, string> };
  alerts: WatchAlert[];
  notified: boolean;
};

const KEY = "acrohub-watch";
const EMPTY: WatchList = { contests: [], pilots: [], snapshots: { contests: {}, pilots: {} }, alerts: [], notified: false };

export function readWatch(): WatchList {
  if (typeof window === "undefined") return EMPTY;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || "") as WatchList;
    return {
      contests: Array.isArray(parsed.contests) ? parsed.contests : [],
      pilots: Array.isArray(parsed.pilots) ? parsed.pilots : [],
      snapshots: {
        contests: parsed.snapshots?.contests ?? {},
        pilots: parsed.snapshots?.pilots ?? {},
      },
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts.slice(0, 30) : [],
      notified: Boolean(parsed.notified),
    };
  } catch {
    return EMPTY;
  }
}

export function writeWatch(list: WatchList) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("acrohub-watch"));
}

export function toggleContest(item: SavedContest): boolean {
  const list = readWatch();
  const exists = list.contests.some((contest) => contest.id === item.id);
  list.contests = exists ? list.contests.filter((contest) => contest.id !== item.id) : [...list.contests, item];
  if (exists) delete list.snapshots.contests[String(item.id)];
  writeWatch(list);
  return !exists;
}

export function togglePilot(item: SavedPilot): boolean {
  const list = readWatch();
  const exists = list.pilots.some((pilot) => pilot.id === item.id);
  list.pilots = exists ? list.pilots.filter((pilot) => pilot.id !== item.id) : [...list.pilots, item];
  if (exists) delete list.snapshots.pilots[String(item.id)];
  writeWatch(list);
  return !exists;
}

export function clearAlerts() {
  const list = readWatch();
  list.alerts = [];
  writeWatch(list);
}
