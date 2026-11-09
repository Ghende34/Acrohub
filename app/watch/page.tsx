"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearAlerts, readWatch, toggleContest, togglePilot, type WatchList } from "@/lib/watch-client";

export default function WatchPage() {
  const [list, setList] = useState<WatchList | null>(null);
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    const sync = () => setList(readWatch());
    sync();
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
    window.addEventListener("acrohub-watch", sync);
    return () => window.removeEventListener("acrohub-watch", sync);
  }, []);

  return (
    <div className="wrap stack">
      <article>
        <p className="kicker">Watch list</p>
        <h1 className="contest-title">Result alerts</h1>
        <p className="lede">
          Watch a contest or a pilot from its page. While Acrohub is open, or the next time you come back, it checks the
          cached IACCDB record about every 10 minutes. A change in posted results shows up here. Browser alerts are
          optional and stay on this device.
        </p>
        <div className="actions">
          <button
            type="button"
            className="chip"
            onClick={async () => {
              if (typeof Notification === "undefined") return;
              const result = await Notification.requestPermission();
              setPermission(result);
            }}
          >
            {permission === "granted" ? "Browser alerts on" : "Allow browser alerts"}
          </button>
          <button type="button" className="chip" onClick={() => clearAlerts()}>
            Clear alerts
          </button>
        </div>
        <p className="note">
          Background push while the phone is asleep needs a push key this project does not have. The working path is this
          watch list plus a browser alert when the site is open or when you return to it. Checks go through Acrohub’s
          existing cache, so IACCDB is not polled faster than about 10 minutes.
        </p>

        <section>
          <h2>Alerts</h2>
          {!list || list.alerts.length === 0 ? (
            <p className="meta">No changes since you started watching.</p>
          ) : (
            <ul className="clean">
              {list.alerts.map((alert) => (
                <li key={`${alert.at}-${alert.message}`}>
                  <Link href={alert.href}>{alert.message}</Link>
                  <span className="meta">{` ${alert.at.slice(0, 16).replace("T", " ")}`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="two">
          <div>
            <h2>Contests</h2>
            {!list || list.contests.length === 0 ? <p className="meta">None yet. Open a contest and choose Watch contest.</p> : null}
            <ul className="clean">
              {list?.contests.map((contest) => (
                <li key={contest.id}>
                  <Link href={`/contests/${contest.id}`}>{contest.name}</Link>
                  <button type="button" className="chip" onClick={() => toggleContest(contest)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Pilots</h2>
            {!list || list.pilots.length === 0 ? <p className="meta">None yet. Open a pilot and choose Watch pilot.</p> : null}
            <ul className="clean">
              {list?.pilots.map((pilot) => (
                <li key={pilot.id}>
                  <Link href={`/pilots/${pilot.id}`}>{pilot.name}</Link>
                  <button type="button" className="chip" onClick={() => togglePilot(pilot)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </article>
    </div>
  );
}
