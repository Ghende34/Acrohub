"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ScoreBar } from "@/components/ScoreBar";
import { levelLabel, placeWord, regionLabel } from "@/lib/format";
import {
  DEFAULT_STATS_FILTER,
  applyStatsFilter,
  bestSingles,
  byAverage,
  byBestFinish,
  byContests,
  byWins,
  categoryBoards,
  competitiveResults,
  facetOptions,
  formatAverage,
  summarizePilots,
  withMinimum,
  type PilotRow,
  type SeasonResult,
  type StatsFilter,
} from "@/lib/season-stats";

const BOARD_LIMIT = 12;

export function StatsExplorer({
  year,
  years,
  results,
  contestsPosted,
}: {
  year: number;
  years: number[];
  results: SeasonResult[];
  contestsPosted: number;
}) {
  const [filter, setFilter] = useState<StatsFilter>(DEFAULT_STATS_FILTER);
  const facets = useMemo(() => facetOptions(results, filter), [results, filter]);
  const filtered = useMemo(() => applyStatsFilter(results, filter), [results, filter]);
  const competitive = useMemo(() => competitiveResults(filtered), [filtered]);
  const excluded = filtered.length - competitive.length;
  const pilots = useMemo(() => withMinimum(summarizePilots(filtered), filter.minResults), [filtered, filter.minResults]);
  const averages = useMemo(() => byAverage(pilots), [pilots]);
  const contests = useMemo(() => byContests(pilots), [pilots]);
  const wins = useMemo(() => byWins(pilots), [pilots]);
  const finishes = useMemo(() => byBestFinish(pilots), [pilots]);
  const singles = useMemo(() => bestSingles(filtered).slice(0, BOARD_LIMIT), [filtered]);
  const categories = useMemo(() => categoryBoards(filtered, filter.minResults), [filtered, filter.minResults]);

  function update(partial: Partial<StatsFilter>) {
    setFilter((current) => {
      const next = { ...current, ...partial };
      if (partial.make != null && partial.make !== current.make) next.model = "";
      return next;
    });
  }

  return (
    <>
      <section className="hero">
        <p className="kicker">From posted category results</p>
        <h1 className="hero-title">
          {year} <span className="accent">stats</span>
        </h1>
        <p className="lede">
          Highest averages, wins, and best scores from {contestsPosted} contests with results. An average is the mean of
          published category percentages. Hors concours results are excluded. This is not an official ranking.
        </p>
      </section>

      <div className="rail" role="navigation" aria-label="Stats year">
        {years.map((item) => (
          <Link key={item} href={`/stats?year=${item}`} className={item === year ? "year is-on" : "year"} aria-current={item === year ? "page" : undefined}>
            {item}
          </Link>
        ))}
      </div>

      <div className="toolbar">
        <form className="search search-plain" role="search" onSubmit={(event) => event.preventDefault()}>
          <label className="sr" htmlFor="stats-name">
            Pilot name
          </label>
          <input
            id="stats-name"
            type="search"
            value={filter.name}
            placeholder="Filter by pilot name"
            onChange={(event) => update({ name: event.target.value })}
          />
        </form>
        <ChipRow label="Class" value={filter.aircat} onChange={(aircat) => update({ aircat })} options={facets.aircats.map((item) => ({ value: item.value, label: item.label }))} allLabel="All classes" />
        <ChipRow
          label="Category"
          value={filter.level}
          onChange={(level) => update({ level })}
          options={facets.levels.map((level) => ({ value: level, label: levelLabel(level) }))}
          allLabel="All categories"
        />
        <ChipRow
          label="Region"
          value={filter.region}
          onChange={(region) => update({ region })}
          options={facets.regions.map((region) => ({ value: region, label: regionLabel(region) }))}
          allLabel="All regions"
        />
        <div className="filter-row">
          <Select label="Make" value={filter.make} onChange={(make) => update({ make })} options={facets.makes} allLabel="All makes" />
          <Select label="Model" value={filter.model} onChange={(model) => update({ model })} options={facets.models} allLabel="All models" />
          <Select
            label="Chapter"
            value={filter.chapter}
            onChange={(chapter) => update({ chapter })}
            options={facets.chapters.map((chapter) => ({ value: chapter, label: `Chapter ${chapter}` }))}
            allLabel="All chapters"
          />
          <Select
            label="Minimum results"
            value={String(filter.minResults)}
            onChange={(value) => update({ minResults: Number(value) })}
            options={[1, 2, 3, 5].map((count) => ({ value: String(count), label: String(count) }))}
            allLabel=""
          />
        </div>
        <p className="count">
          {competitive.length} scored results
          {excluded > 0 ? ` · ${excluded} hors concours excluded` : ""}
          {` · ${pilots.length} pilots with at least ${filter.minResults}`}
        </p>
      </div>

      <dl className="summary-grid">
        <Standout term="Highest average" value={averages[0] ? formatAverage(averages[0].average) : "—"} detail={averages[0]?.name} />
        <Standout term="Most contests" value={contests[0] ? String(contests[0].contests) : "—"} detail={contests[0]?.name} />
        <Standout term="Most wins" value={wins[0] ? String(wins[0].wins) : "—"} detail={wins[0]?.name} />
        <Standout term="Best single score" value={singles[0] ? `${singles[0].percent.toFixed(2)}%` : "—"} detail={singles[0]?.pilotName} />
      </dl>

      <div className="board-grid">
        <Board title="Highest average" rows={averages} render={(row) => formatAverage(row.average)} detail={(row) => `${row.scored} results · ${row.contests} contests`} bar={(row) => row.average} />
        <Board title="Best finish" rows={finishes} render={(row) => (row.bestRank != null ? placeWord(row.bestRank) : "—")} detail={(row) => `${row.wins} wins · avg ${formatAverage(row.average)}`} bar={(row) => row.average} />
        <Board title="Most contests" rows={contests} render={(row) => String(row.contests)} detail={(row) => `${row.scored} results · avg ${formatAverage(row.average)}`} bar={(row) => row.average} />
        <Board title="Most wins" rows={wins} render={(row) => String(row.wins)} detail={(row) => `Best ${row.bestRank != null ? placeWord(row.bestRank) : "—"} · avg ${formatAverage(row.average)}`} bar={(row) => row.average} />
      </div>

      <section>
        <h2 className="section-title">Best single scores</h2>
        <p className="meta">One posted category percentage. Not an average.</p>
        <ul className="form-chart">
          {singles.map((result) => (
            <li key={`${result.contestId}-${result.pilotId}-${result.categoryName}`}>
              <div className="form-row">
                <span>
                  <Link href={`/pilots/${result.pilotId}`}>{result.pilotName}</Link>
                  <span className="meta">
                    {" "}
                    {result.categoryName} · <Link href={`/contests/${result.contestId}`}>{result.contestName}</Link>
                  </span>
                </span>
                <ScoreBar percent={result.percent} />
                <span className="form-pct">
                  {result.percent.toFixed(2)}%{result.rank != null ? ` · ${placeWord(result.rank)}` : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {categories.length > 1 ? (
        <section>
          <h2 className="section-title">Category leaders</h2>
          <p className="meta">Highest average inside each category, using the same minimum.</p>
          <div className="board-grid">
            {categories.map((category) => (
              <article key={category.category} className="stat-card">
                <h3>{category.category}</h3>
                {category.leaders.length === 0 ? (
                  <p className="meta">
                    No pilot has {filter.minResults} results.
                    {category.bestSingle ? ` Best single score is ${category.bestSingle.percent.toFixed(2)}% by ${category.bestSingle.pilotName}.` : ""}
                  </p>
                ) : (
                  <ol className="mini-board">
                    {category.leaders.map((row) => (
                      <li key={row.pilotId}>
                        <Link href={`/pilots/${row.pilotId}`}>{row.name}</Link>
                        <span>{formatAverage(row.average)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function Standout({ term, value, detail }: { term: string; value: string; detail?: string }) {
  return (
    <div>
      <dt>{term}</dt>
      <dd>{value}</dd>
      {detail ? <p className="meta">{detail}</p> : null}
    </div>
  );
}

function Board({
  title,
  rows,
  render,
  detail,
  bar,
}: {
  title: string;
  rows: PilotRow[];
  render: (row: PilotRow) => string;
  detail: (row: PilotRow) => string;
  bar: (row: PilotRow) => number;
}) {
  const visible = rows.slice(0, BOARD_LIMIT);
  return (
    <section className="stat-card">
      <h2 className="section-title">{title}</h2>
      {visible.length === 0 ? (
        <p className="meta">No pilots match. Lower the minimum or clear a filter.</p>
      ) : (
        <ol className="mini-board">
          {visible.map((row, index) => (
            <li key={row.pilotId}>
              <span className="mini-rank">{index + 1}</span>
              <span>
                <Link href={`/pilots/${row.pilotId}`}>{row.name}</Link>
                <span className="meta">
                  {" "}
                  {detail(row)}
                  {row.airplane ? ` · ${row.airplane}` : ""}
                </span>
                <ScoreBar percent={bar(row)} />
              </span>
              <span className="form-pct">{render(row)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ChipRow({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  if (options.length === 0) return null;
  return (
    <div className="chips" role="group" aria-label={label}>
      <button type="button" className={value === "" ? "chip is-on" : "chip"} aria-pressed={value === ""} onClick={() => onChange("")}>
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "chip is-on" : "chip"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {allLabel ? <option value="">{allLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
