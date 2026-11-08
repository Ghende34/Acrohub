"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink } from "@/components/ExternalLink";
import { judgeLeadersUrl, judgeUrl, notesUrl } from "@/lib/constants";
import type { JudgeLeaderRow, JudgeLeaders } from "@/lib/types";

export function JudgeBoard({ leaders }: { leaders: JudgeLeaders }) {
  const [categoryName, setCategoryName] = useState(leaders.categories[0]?.name ?? "");
  const category = leaders.categories.find((item) => item.name === categoryName) ?? leaders.categories[0];
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <article>
      <p className="kicker">IACCDB judge experience</p>
      <h1 className="contest-title">Judge experience {leaders.year}</h1>
      <p className="lede">
        Judges IACCDB lists for {leaders.year}, in the published order. Rank agreement and pair agreement use the same
        −100 to 100 scales as the contest pages.
      </p>
      <div className="actions">
        <ExternalLink href={judgeLeadersUrl(leaders.year)}>Official judge experience</ExternalLink>
        <a href={`${notesUrl()}#metrics`}>Metric notes</a>
      </div>
      <div className="rail" role="navigation" aria-label="Experience year" style={{ marginTop: "1rem" }}>
        {leaders.years.map((year) => (
          <Link key={year} href={`/judges?year=${year}`} className={year === leaders.year ? "year is-on" : "year"} aria-current={year === leaders.year ? "page" : undefined}>
            {year}
          </Link>
        ))}
      </div>
      {leaders.categories.length === 0 || !category ? (
        <div className="empty">
          <h2>No judge experience published</h2>
          <p>IACCDB did not list judges for this year.</p>
        </div>
      ) : (
        <>
          <div className="tabs" role="tablist" aria-label="Category" style={{ marginTop: "0.8rem" }}>
            {leaders.categories.map((item) => (
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
                {item.name}
              </button>
            ))}
          </div>
          <div className="category-head">
            <h2>{category.name}</h2>
            <p className="meta">{category.judges.length} judges, in IACCDB order</p>
          </div>
          <ul className="judge-compare">
            {category.judges.map((judge) => (
              <JudgeRow key={judge.id} judge={judge} open={openId === judge.id} onToggle={() => setOpenId(openId === judge.id ? null : judge.id)} />
            ))}
          </ul>
        </>
      )}
    </article>
  );
}

function JudgeRow({ judge, open, onToggle }: { judge: JudgeLeaderRow; open: boolean; onToggle: () => void }) {
  const rho = Number(judge.rho);
  const gamma = Number(judge.gamma);
  return (
    <li className={open ? "judge-row is-on" : "judge-row"}>
      <button type="button" className="judge-select" aria-expanded={open} onClick={onToggle}>
        <span>
          <span className="rank">{judge.order}</span>
          <span className="pilot-name">{judge.name}</span>
        </span>
        <span className="judge-figures">
          <span className="metric-figure">
            <span className="metric-kicker">Rank agreement</span>
            <span className="metric-value">{judge.rho}</span>
            <span className="meter" aria-hidden="true">
              <span style={{ width: `${barWidth(rho)}%` }} />
            </span>
          </span>
          <span className="metric-figure">
            <span className="metric-kicker">Pair agreement</span>
            <span className="metric-value">{judge.gamma}</span>
            <span className="meter" aria-hidden="true">
              <span style={{ width: `${barWidth(gamma)}%` }} />
            </span>
          </span>
        </span>
        <span className="meta">
          {judge.flightPrograms} flights · {judge.pilotFlights} pilot flights · {judge.minorityZeros} minority zeros ·{" "}
          {judge.minorityGrades} minority grades
        </span>
      </button>
      {open ? (
        <div className="detail">
          <dl className="metrics">
            <Stat term="Rank agreement ρ" value={judge.rho} />
            <Stat term="Pair agreement γ" value={judge.gamma} />
            <Stat term="Pilot flights" value={judge.pilotFlights} />
            <Stat term="Pilot pairs" value={judge.pilotPairs} />
            <Stat term="Flight programs" value={judge.flightPrograms} />
            <Stat term="Average pilots" value={judge.averagePilots} />
            <Stat term="Grades given" value={judge.grades} />
            <Stat term="Average K" value={judge.averageK} />
            <Stat term="Minority zeros" value={judge.minorityZeros} />
            <Stat term="Minority grades" value={judge.minorityGrades} />
          </dl>
          <ExternalLink href={judgeUrl(judge.id)}>Open this judge on IACCDB</ExternalLink>
        </div>
      ) : null}
    </li>
  );
}

function Stat({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt>{term}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

function barWidth(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
