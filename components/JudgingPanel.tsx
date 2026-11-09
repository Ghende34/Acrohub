"use client";

import { useState } from "react";
import { ExternalLink } from "@/components/ExternalLink";
import { judgeLeadersUrl, judgeUrl, notesUrl } from "@/lib/constants";
import { formatMetric, fullName } from "@/lib/format";
import type { CategoryResult, FlightDetail, LineJudge, StandingJudge } from "@/lib/types";

export function JudgingPanel({
  category,
  flights,
}: {
  category: CategoryResult;
  flights: Record<number, FlightDetail>;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  if (category.judges.length === 0) return null;
  const selected = category.judges.find((judge) => judge.id === selectedId) ?? null;
  const rhoValues = category.judges.map((judge) => judge.rho).filter((value): value is number => value != null);
  const rhoMin = rhoValues.length ? Math.min(...rhoValues) : null;
  const rhoMax = rhoValues.length ? Math.max(...rhoValues) : null;

  return (
    <section className="judging" aria-labelledby={`judging-${category.sequence}`}>
      <div className="category-head">
        <div>
          <p className="group-label">Judging</p>
          <h2 id={`judging-${category.sequence}`}>How this panel scored</h2>
        </div>
        <p className="meta">
          {category.judges.length} {category.judges.length === 1 ? "judge" : "judges"} on {category.name}. Metrics are the
          category rollup from IACCDB, before penalties.
        </p>
      </div>
      {rhoMin != null && rhoMax != null ? (
        <p className="note">
          Rank agreement runs from {rhoMin} to {rhoMax}
          {rhoMax !== rhoMin ? ` — a spread of ${rhoMax - rhoMin}` : ""}. 100 means a judge ordered the pilots the same
          way as the result.
        </p>
      ) : null}
      <ul className="judge-compare">
        {category.judges.map((judge) => {
          const active = judge.id === selected?.id;
          return (
            <li key={judge.id} className={active ? "judge-row is-on" : "judge-row"}>
              <button type="button" className="judge-select" aria-pressed={active} onClick={() => setSelectedId(active ? null : judge.id)}>
                <span className="pilot-name">{fullName(judge.givenName, judge.familyName)}</span>
                <span className="judge-figures">
                  <MetricFigure label="Rank agreement" hint="Spearman ρ" value={judge.rho} />
                  <MetricFigure label="Pair agreement" hint="Gamma γ" value={judge.gamma} />
                </span>
                <span className="meta">
                  {formatMetric(judge.flightCount)} flight {judge.flightCount === 1 ? "program" : "programs"}
                  {" · "}
                  {formatMetric(judge.minorityZeros)} minority zeros
                  {" · "}
                  {formatMetric(judge.minorityGrades)} minority grades
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {selected ? <JudgeFocus judge={selected} categoryFlights={category.flights} flights={flights} /> : (
        <p className="hint">Select a judge to see that person’s flight-by-flight numbers.</p>
      )}
      <FlightCompare flights={category.flights.map((flight) => flights[flight.id]).filter((flight): flight is FlightDetail => flight != null)} highlightId={selected?.id ?? null} />
      <dl className="glossary">
        <div>
          <dt>Rank agreement (ρ)</dt>
          <dd>Spearman rank correlation, scaled from −100 to 100. 100 means this judge ordered the pilots the same as the result ranking before penalties. Zero is about random. Negative means the order ran the other way.</dd>
        </div>
        <div>
          <dt>Pair agreement (γ)</dt>
          <dd>Goodman and Kruskal’s gamma, on the same −100 to 100 scale. It counts pilot pairs the judge ordered the same way as the result.</dd>
        </div>
        <div>
          <dt>Ranking index (RI)</dt>
          <dd>The CIVA figure published on a flight. Zero is perfect agreement. Larger numbers mean more disagreement. Shown only when that flight record includes it.</dd>
        </div>
        <div>
          <dt>Minority zeros and grades</dt>
          <dd>Counts of hard-zero grades and other grades IACCDB marks as out of step with the rest of the panel.</dd>
        </div>
      </dl>
      <p className="source-line">
        Definitions follow the <a href={`${notesUrl()}#metrics`}>IACCDB judge notes</a>. Season totals are on the{" "}
        <a href={judgeLeadersUrl()}>judge experience</a> page.
      </p>
    </section>
  );
}

function MetricFigure({ label, hint, value }: { label: string; hint: string; value: number | null }) {
  return (
    <span className="metric-figure">
      <span className="metric-kicker">
        {label} <span className="faint">{hint}</span>
      </span>
      <span className="metric-value">{formatMetric(value)}</span>
      <AgreementMeter value={value} />
    </span>
  );
}

function AgreementMeter({ value }: { value: number | null }) {
  const width = value == null || !Number.isFinite(value) ? 0 : Math.max(0, Math.min(100, value));
  return (
    <span className="meter" aria-hidden="true">
      <span style={{ width: `${width}%` }} />
    </span>
  );
}

function JudgeFocus({
  judge,
  categoryFlights,
  flights,
}: {
  judge: StandingJudge;
  categoryFlights: CategoryResult["flights"];
  flights: Record<number, FlightDetail>;
}) {
  const lines = categoryFlights.flatMap((flight) => {
    const detail = flights[flight.id];
    const line = detail?.lineJudges.find((item) => item.id === judge.id);
    return line ? [{ flightName: flight.name, line }] : [];
  });
  return (
    <div className="judge-focus">
      <div className="category-head">
        <h3>{fullName(judge.givenName, judge.familyName)}</h3>
        <ExternalLink href={judgeUrl(judge.id)}>Judge record on IACCDB</ExternalLink>
      </div>
      <p className="meta">
        Category rollup: rank agreement {formatMetric(judge.rho)}, pair agreement {formatMetric(judge.gamma)},{" "}
        {formatMetric(judge.flightCount)} flight programs, {formatMetric(judge.minorityZeros)} minority zeros,{" "}
        {formatMetric(judge.minorityGrades)} minority grades.
      </p>
      {lines.length === 0 ? (
        <p className="note">Flight-line numbers appear here after the flight records load.</p>
      ) : (
        <ul className="line-list">
          {lines.map(({ flightName, line }) => (
            <LineStat key={`${line.id}-${flightName}`} title={flightName} line={line} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FlightCompare({ flights, highlightId }: { flights: FlightDetail[]; highlightId: number | null }) {
  const withJudges = flights.filter((flight) => flight.lineJudges.length > 0);
  if (withJudges.length === 0) return null;
  return (
    <div className="flight-compare">
      <h3>Flight by flight</h3>
      <p className="meta">Each bar is that judge’s rank agreement on the flight, from the flight record.</p>
      {withJudges.map((flight) => (
        <div key={flight.id} className="flight-block">
          <p className="kicker">{flight.name}</p>
          <ul className="line-list">
            {flight.lineJudges.map((line) => (
              <li key={line.id} className={line.id === highlightId ? "line-stat is-on" : "line-stat"}>
                <span className="pilot-name">{line.name}</span>
                <span className="metric-value">{formatMetric(line.rho)}</span>
                <AgreementMeter value={line.rho} />
                <span className="meta">
                  Pair agreement {formatMetric(line.gamma)}
                  {line.ri ? ` · RI ${line.ri}` : ""}
                  {line.minorityZeros ? ` · ${line.minorityZeros} minority zeros` : ""}
                  {line.assistant ? ` · assisted by ${line.assistant}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function LineStat({ title, line }: { title: string; line: LineJudge }) {
  return (
    <li className="line-stat">
      <span className="pilot-name">{title}</span>
      <span className="metric-value">{formatMetric(line.rho)}</span>
      <AgreementMeter value={line.rho} />
      <span className="meta">
        Rank agreement {formatMetric(line.rho)} · pair agreement {formatMetric(line.gamma)}
        {line.ri ? ` · RI ${line.ri}` : ""}
        {" · "}
        {formatMetric(line.pilotCount)} pilots · {formatMetric(line.figureCount)} grades
        {line.averageK != null ? ` · avg K ${line.averageK.toFixed(2)}` : ""}
        {" · "}
        {formatMetric(line.minorityZeros)} minority zeros · {formatMetric(line.minorityGrades)} minority grades
        {line.assistant ? ` · assisted by ${line.assistant}` : ""}
      </span>
    </li>
  );
}
