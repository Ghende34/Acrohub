"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink } from "@/components/ExternalLink";
import { ScoreBar } from "@/components/ScoreBar";
import { pilotUrl, regionalsUrl } from "@/lib/constants";
import { regionLabel } from "@/lib/format";
import type { RegionalSeries } from "@/lib/types";

export function LeadersBoard({ series }: { series: RegionalSeries }) {
  const [regionName, setRegionName] = useState(series.regions[0]?.name ?? "");
  const region = series.regions.find((item) => item.name === regionName) ?? series.regions[0];
  const [categoryName, setCategoryName] = useState(region?.categories[0]?.name ?? "");
  const category = region?.categories.find((item) => item.name === categoryName) ?? region?.categories[0];
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <article>
      <p className="kicker">IACCDB regional series</p>
      <h1 className="contest-title">Regional series {series.year}</h1>
      <p className="lede">
        Published regional standings for {series.year}. Percents and contest totals are shown as IACCDB prints them.
      </p>
      <div className="actions">
        <ExternalLink href={regionalsUrl(series.year)}>Official regional series</ExternalLink>
      </div>
      <div className="rail" role="navigation" aria-label="Series year" style={{ marginTop: "1rem" }}>
        {series.years.map((year) => (
          <Link key={year} href={`/leaders?year=${year}`} className={year === series.year ? "year is-on" : "year"} aria-current={year === series.year ? "page" : undefined}>
            {year}
          </Link>
        ))}
      </div>

      {series.regions.length === 0 || !region || !category ? (
        <div className="empty">
          <h2>No regional standings</h2>
          <p>IACCDB did not publish category leaders for this year.</p>
        </div>
      ) : (
        <>
          <div className="chips" role="tablist" aria-label="Region" style={{ marginTop: "0.8rem" }}>
            {series.regions.map((item) => (
              <button
                key={item.name}
                type="button"
                role="tab"
                className={item.name === region.name ? "chip is-on" : "chip"}
                aria-selected={item.name === region.name}
                onClick={() => {
                  setRegionName(item.name);
                  setCategoryName(item.categories[0]?.name ?? "");
                  setOpenId(null);
                }}
              >
                {regionLabel(item.name)}
              </button>
            ))}
          </div>
          <div className="tabs" role="tablist" aria-label="Category">
            {region.categories.map((item) => (
              <button
                key={item.name}
                type="button"
                role="tab"
                className={item.name === category.name ? "tab is-on" : "tab"}
                aria-selected={item.name === category.name}
                onClick={() => {
                  setCategoryName(item.name);
                  setOpenId(null);
                }}
              >
                {shortCategory(item.name, region.name)}
              </button>
            ))}
          </div>
          <div className="category-head">
            <h2>{category.name}</h2>
            <p className="meta">{category.pilots.length} pilots</p>
          </div>
          <ul className="leader-list">
            {category.pilots.map((pilot) => {
              const open = openId === pilot.id;
              const percent = Number.parseFloat(pilot.percent);
              return (
                <li key={pilot.id} className="leader">
                  <button
                    type="button"
                    className="leader-toggle"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : pilot.id)}
                  >
                    <span className="rank">{pilot.rank}</span>
                    <span className="leader-name">{pilot.name}</span>
                    <span className="total">
                      <span className="total-pct">{pilot.percent}</span>
                      <span className={open ? "chev is-open" : "chev"} aria-hidden="true" />
                    </span>
                  </button>
                  <div style={{ padding: "0 0.2rem 0.7rem 3rem" }}>
                    <ScoreBar percent={Number.isFinite(percent) ? percent : null} />
                  </div>
                  {open ? (
                    <div className="detail">
                      <ul className="breakdown">
                        {pilot.contests.map((contest) => (
                          <li key={contest.id}>
                            <Link href={`/contests/${contest.id}`}>{contest.name}</Link>
                            <span>
                              {contest.points} / {contest.possible} · {contest.percent}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <ExternalLink href={pilotUrl(pilot.id)}>Pilot on IACCDB</ExternalLink>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="source-line">
            Chapter membership can affect who is eligible for a regional title. IACCDB describes that rule on the{" "}
            <a href={regionalsUrl(series.year)}>official Regional Series page</a>.
          </p>
        </>
      )}
    </article>
  );
}

function shortCategory(name: string, region: string): string {
  return name.replace(new RegExp(`^${region}\\s+`, "i"), "");
}
