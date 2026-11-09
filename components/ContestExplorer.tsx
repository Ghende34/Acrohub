"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { OFFICIAL_RESULTS_FROM_YEAR } from "@/lib/constants";
import { dateParts, isArchivalYear, locationLine, REGION_ORDER, regionLabel } from "@/lib/format";
import type { ContestSummary } from "@/lib/types";

export function ContestExplorer({
  years,
  selectedYear,
  contests,
}: {
  years: number[];
  selectedYear: number;
  contests: ContestSummary[];
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const regions = useMemo(() => {
    const present = new Set(contests.map((contest) => contest.region).filter(Boolean));
    const ordered = REGION_ORDER.filter((name) => present.has(name));
    for (const name of present) {
      if (!ordered.includes(name)) ordered.push(name);
    }
    return ordered;
  }, [contests]);

  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return contests.filter((contest) => {
      if (region !== "all" && contest.region !== region) return false;
      if (tokens.length === 0) return true;
      const haystack = [contest.name, contest.city, contest.state, contest.director, contest.region, String(contest.chapter)]
        .join(" ")
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [contests, query, region]);

  const withResults = contests.filter((contest) => contest.hasResults).length;
  const groups = new Map<string, ContestSummary[]>();
  for (const contest of filtered) {
    const key = dateParts(contest.start).key;
    const list = groups.get(key) ?? [];
    list.push(contest);
    groups.set(key, list);
  }

  return (
    <>
      <section className="hero">
        <p className="hero-year" aria-hidden="true">
          {selectedYear}
        </p>
        <p className="kicker">Unofficial viewer of IAC contest results</p>
        <h1 className="hero-title">
          Acro<span className="accent">hub</span>
        </h1>
        <p className="lede">
          Contest standings from the IAC Contest Database, read as a season board instead of a spreadsheet.{" "}
          {selectedYear} contest year.
        </p>
        <dl className="stats">
          <div>
            <dt>Contests</dt>
            <dd>{contests.length}</dd>
          </div>
          <div>
            <dt>With results</dt>
            <dd>{withResults}</dd>
          </div>
          <div>
            <dt>Not posted</dt>
            <dd>{contests.length - withResults}</dd>
          </div>
        </dl>
      </section>

      <div className="toolbar">
        <div className="rail" role="navigation" aria-label="Contest year">
          {years.map((year) => (
            <Link
              key={year}
              href={`/?year=${year}`}
              className={year === selectedYear ? "year is-on" : year < OFFICIAL_RESULTS_FROM_YEAR ? "year is-archival" : "year"}
              aria-current={year === selectedYear ? "page" : undefined}
              title={year < OFFICIAL_RESULTS_FROM_YEAR ? "Archival results, before 2014" : undefined}
            >
              {year}
            </Link>
          ))}
        </div>
        {isArchivalYear(selectedYear) ? (
          <p className="banner">
            IACCDB marks results before 2014 as archival computations for study, not official standings.
          </p>
        ) : (
          <p className="hint">Official results year. Press / to search.</p>
        )}
        <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
          <label className="sr" htmlFor="contest-search">
            Search contests
          </label>
          <SearchIcon />
          <input
            id="contest-search"
            ref={searchRef}
            type="search"
            value={query}
            placeholder="Search name, city, or contest director"
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
        <div className="chips" role="group" aria-label="Region">
          <button type="button" className={region === "all" ? "chip is-on" : "chip"} aria-pressed={region === "all"} onClick={() => setRegion("all")}>
            All regions
          </button>
          {regions.map((name) => (
            <button
              key={name}
              type="button"
              className={region === name ? "chip is-on" : "chip"}
              aria-pressed={region === name}
              onClick={() => setRegion(name)}
            >
              {regionLabel(name)}
            </button>
          ))}
        </div>
        <p className="count">
          {filtered.length} of {contests.length} contests
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <h2>No contests match</h2>
          <p>Try another region or clear the search.</p>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              setQuery("");
              setRegion("all");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        [...groups.entries()].map(([key, items]) => (
          <section key={key} aria-labelledby={`month-${key}`}>
            <h2 className="month" id={`month-${key}`}>
              {dateParts(items[0].start).monthHeading}
              <span>{items.length}</span>
            </h2>
            <div className="cards">
              {items.map((contest) => {
                const date = dateParts(contest.start);
                return (
                  <Link key={contest.id} href={`/contests/${contest.id}`} className="card" data-testid="contest-card">
                    <div className="date-block" aria-hidden="true">
                      <span className="mon">{date.month}</span>
                      <span className="day">{date.day}</span>
                    </div>
                    <div>
                      <p className="kicker">
                        {regionLabel(contest.region)}
                        {contest.chapter !== "" ? ` · Ch. ${contest.chapter}` : ""}
                      </p>
                      <h2>{contest.name}</h2>
                      <p>{locationLine(contest.city, contest.state)}</p>
                      {contest.director ? <p className="meta">Contest director {contest.director}</p> : null}
                      <p className="sr">{date.label}</p>
                      <span className={contest.hasResults ? "badge" : "badge pending"}>
                        {contest.hasResults ? "Results" : "Not posted"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5 L14 14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
