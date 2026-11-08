"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink } from "@/components/ExternalLink";
import { JudgingPanel } from "@/components/JudgingPanel";
import { ScoreBar } from "@/components/ScoreBar";
import { groupCategories } from "@/lib/categories";
import { contestUrl, flightUrl, notesUrl, pilotScoresUrl, pilotUrl } from "@/lib/constants";
import {
  airplaneLine,
  dateParts,
  formatPercent,
  formatPoints,
  formatPossible,
  fullName,
  isArchivalYear,
  levelLabel,
  locationLine,
  percentNumber,
  placeWord,
  regionLabel,
} from "@/lib/format";
import type { CategoryResult, ContestDetail, FlightDetail, FlightPilotScore, StandingPilot } from "@/lib/types";

export function ContestBoard({
  contest,
  initialFlights,
}: {
  contest: ContestDetail;
  initialFlights: FlightDetail[];
}) {
  const groups = useMemo(() => groupCategories(contest.categoryResults), [contest]);
  const [aircat, setAircat] = useState(groups[0]?.aircat ?? "");
  const group = groups.find((item) => item.aircat === aircat) ?? groups[0];
  const [sequence, setSequence] = useState<number | null>(group?.categories[0]?.sequence ?? null);
  const category = group?.categories.find((item) => item.sequence === sequence) ?? group?.categories[0];
  const [openId, setOpenId] = useState<number | null>(null);
  const [flights, setFlights] = useState<Record<number, FlightDetail>>(() => {
    const record: Record<number, FlightDetail> = {};
    for (const flight of initialFlights) record[flight.id] = flight;
    return record;
  });
  const [flightError, setFlightError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const flightsRef = useRef(flights);
  flightsRef.current = flights;

  const flightKey = category?.flights.map((flight) => flight.id).join(",") ?? "";

  useEffect(() => {
    setOpenId(null);
    setFlightError(false);
  }, [contest.id, category?.sequence]);

  useEffect(() => {
    if (!category) return;
    const missing = category.flights.filter((flight) => !flightsRef.current[flight.id]);
    if (missing.length === 0) return;
    const controller = new AbortController();
    let cancelled = false;
    Promise.all(
      missing.map(async (flight) => {
        const response = await fetch(`/api/flights/${flight.id}`, { signal: controller.signal });
        if (!response.ok) return null;
        return (await response.json()) as FlightDetail;
      }),
    )
      .then((loaded) => {
        if (cancelled) return;
        const found = loaded.filter((flight): flight is FlightDetail => flight != null);
        setFlightError(found.length !== missing.length);
        if (found.length === 0) return;
        setFlights((current) => {
          const next = { ...current };
          for (const flight of found) next[flight.id] = flight;
          return next;
        });
      })
      .catch((error: unknown) => {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        setFlightError(true);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [contest.id, flightKey, attempt, category]);

  const date = dateParts(contest.start);
  const place = locationLine(contest.city, contest.state);

  return (
    <article className="contest-head">
      <header>
        <p className="kicker">
          {contest.year || "Contest"} · {regionLabel(contest.region)}
        </p>
        <h1 className="contest-title">{contest.name}</h1>
        <div className="facts">
          <span className="fact">{date.label}</span>
          {place ? <span className="fact">{place}</span> : null}
          {contest.chapter !== "" ? <span className="fact">Chapter {contest.chapter}</span> : null}
          {contest.director ? <span className="fact">Contest director {contest.director}</span> : null}
        </div>
        <div className="actions">
          <ExternalLink href={contestUrl(contest.id)}>View on IACCDB</ExternalLink>
          <Link href={`/?year=${contest.year || ""}`}>Back to {contest.year}</Link>
        </div>
      </header>

      {isArchivalYear(contest.year) ? (
        <p className="banner">
          This contest is before 2014. IACCDB publishes it as an archival computation, not an official result.
        </p>
      ) : null}

      {contest.categoryResults.length === 0 || !category || !group ? (
        <div className="hold">
          <p className="kicker">No results</p>
          <h2>Results have not been posted</h2>
          <p>IACCDB lists this contest with no category standings yet. Acrohub rechecks the source about every 10 minutes.</p>
          <ExternalLink href={contestUrl(contest.id)}>Check the contest on IACCDB</ExternalLink>
        </div>
      ) : (
        <>
          {groups.length > 1 ? (
            <div className="chips" role="tablist" aria-label="Power or glider">
              {groups.map((item) => (
                <button
                  key={item.aircat}
                  type="button"
                  role="tab"
                  className={item.aircat === group.aircat ? "chip is-on" : "chip"}
                  aria-selected={item.aircat === group.aircat}
                  onClick={() => {
                    setAircat(item.aircat);
                    setSequence(item.categories[0]?.sequence ?? null);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          {group.categories.length > 1 ? (
            <div className="tabs" role="tablist" aria-label={`${group.label} categories`}>
              {group.categories.map((item) => (
                <button
                  key={item.sequence}
                  type="button"
                  role="tab"
                  className={item.sequence === category.sequence ? "tab is-on" : "tab"}
                  aria-selected={item.sequence === category.sequence}
                  onClick={() => setSequence(item.sequence)}
                >
                  {levelLabel(item.level)} · {item.pilots.length}
                </button>
              ))}
            </div>
          ) : null}

          <div className="category-head">
            <div>
              <p className="group-label">{group.label}</p>
              <h2>{category.name}</h2>
            </div>
            <p className="meta">
              {category.pilots.length} {category.pilots.length === 1 ? "pilot" : "pilots"}
              {category.flights.length > 0 ? ` · ${category.flights.map((flight) => flight.name).join(" · ")}` : ""}
            </p>
          </div>

          <Podium pilots={category.pilots} />
          <Standings
            contestId={contest.id}
            category={category}
            flights={flights}
            flightError={flightError}
            openId={openId}
            onToggle={(id) => setOpenId((current) => (current === id ? null : id))}
            onRetry={() => {
              setFlightError(false);
              setAttempt((value) => value + 1);
            }}
          />
          <JudgingPanel key={category.sequence} category={category} flights={flights} />
          <p className="source-line">
            Points, ranks, airplanes, and judge metrics are the IACCDB contest record. Percentages are points divided by
            total possible, rounded to two decimals.{" "}
            <a href={notesUrl()}>IACCDB notes</a>
          </p>
        </>
      )}
    </article>
  );
}

function Podium({ pilots }: { pilots: StandingPilot[] }) {
  const top = pilots
    .filter((pilot) => pilot.rank === 1 || pilot.rank === 2 || pilot.rank === 3)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  if (top.length === 0) return null;
  return (
    <ul className="podium" data-testid="podium">
      {top.map((pilot) => (
        <li key={pilot.id} className={`pod place-${pilot.rank}`}>
          <span className="place">{pilot.rank ? placeWord(pilot.rank) : "Rank"}</span>
          <span className="pod-pct">{formatPercent(pilot.points, pilot.totalPossible)}</span>
          <span className="pod-name">
            {fullName(pilot.givenName, pilot.familyName)}
            {pilot.starQualifying ? <Star /> : null}
            {pilot.horsConcours ? <span className="hc">Hors concours</span> : null}
          </span>
          <span className="meta">
            {airplaneLine(pilot.airplane.make, pilot.airplane.model)}
            {pilot.airplane.reg ? ` · ${pilot.airplane.reg}` : ""}
          </span>
          <span className="meta">
            {formatPoints(pilot.points)} of {formatPossible(pilot.totalPossible)}
          </span>
          <span className="pedestal" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}

function Standings({
  contestId,
  category,
  flights,
  flightError,
  openId,
  onToggle,
  onRetry,
}: {
  contestId: number;
  category: CategoryResult;
  flights: Record<number, FlightDetail>;
  flightError: boolean;
  openId: number | null;
  onToggle: (id: number) => void;
  onRetry: () => void;
}) {
  if (category.pilots.length === 0) {
    return (
      <div className="empty">
        <h2>No pilots posted</h2>
        <p>This category has no pilot results in the contest record.</p>
      </div>
    );
  }
  return (
    <ul className="standings">
      {category.pilots.map((pilot) => {
        const open = openId === pilot.id;
        const percent = formatPercent(pilot.points, pilot.totalPossible);
        return (
          <li key={pilot.id} className={open ? "standing is-open" : "standing"} data-testid="standing">
            <button
              type="button"
              className="standing-toggle"
              aria-expanded={open}
              aria-controls={`pilot-panel-${pilot.id}`}
              onClick={() => onToggle(pilot.id)}
            >
              <span className="rank">{pilot.rank ?? "–"}</span>
              <span>
                <span className="pilot-name">
                  {fullName(pilot.givenName, pilot.familyName)}
                  {pilot.starQualifying ? <Star /> : null}
                  {pilot.horsConcours ? <span className="hc">Hors concours</span> : null}
                </span>
                <span className="meta" style={{ display: "block" }}>
                  {pilot.chapter ? `Chapter ${pilot.chapter} · ` : ""}
                  {airplaneLine(pilot.airplane.make, pilot.airplane.model)}
                  {pilot.airplane.reg ? ` · ${pilot.airplane.reg}` : ""}
                </span>
              </span>
              <span className="total">
                <span className="total-pct">{percent}</span>
                <span className="meta" style={{ display: "block" }}>
                  {formatPoints(pilot.points)} of {formatPossible(pilot.totalPossible)}
                  <span className={open ? "chev is-open" : "chev"} aria-hidden="true" />
                </span>
              </span>
              {category.flights.length > 0 ? (
                <span className="flight-grid">
                  {category.flights.map((flight) => {
                    const detail = flights[flight.id];
                    const score = detail?.pilots.find((row) => row.pilotId === pilot.id);
                    return <FlightCell key={flight.id} name={flight.name} score={score} pending={!detail && !flightError} />;
                  })}
                </span>
              ) : null}
            </button>
            {open ? (
              <div className="detail" id={`pilot-panel-${pilot.id}`}>
                <div className="detail-links">
                  <ExternalLink href={pilotUrl(pilot.id)}>Pilot on IACCDB</ExternalLink>
                  <ExternalLink href={pilotScoresUrl(pilot.id, contestId)}>Score sheet</ExternalLink>
                  {pilot.iacId ? <span className="meta">IAC {pilot.iacId}</span> : null}
                </div>
                {category.flights.length === 0 ? <p className="note">No flight records are attached to this category.</p> : null}
                {flightError ? (
                  <p className="note">
                    Flight scores could not be loaded. Overall standings above are still from the contest record.{" "}
                    <button type="button" className="btn secondary" onClick={onRetry}>
                      Try flights again
                    </button>
                  </p>
                ) : null}
                {category.flights.map((flight) => {
                  const detail = flights[flight.id];
                  const score = detail?.pilots.find((row) => row.pilotId === pilot.id);
                  if (!detail) return null;
                  if (!score) return <p key={flight.id} className="note">{flight.name}: no score on this flight.</p>;
                  const changed = score.penalty !== 0 || (score.scoreBeforePenalties && score.scoreBeforePenalties !== score.score);
                  return (
                    <div key={flight.id}>
                      <p>
                        <strong>{flight.name}</strong> · {formatPoints(score.score)} · {formatPercent(score.score, score.totalPossible)}
                        {score.rank != null ? ` · rank ${score.rank}` : ""}
                        {score.penalty ? ` · penalty ${score.penalty}` : ""}
                      </p>
                      {changed && score.scoreBeforePenalties ? (
                        <p className="meta">
                          Before penalties {formatPoints(score.scoreBeforePenalties)}
                          {score.rankBeforePenalties != null ? `, rank ${score.rankBeforePenalties}` : ""}
                        </p>
                      ) : null}
                      <ExternalLink href={flightUrl(flight.id)}>{flight.name} flight on IACCDB</ExternalLink>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function FlightCell({ name, score, pending }: { name: string; score?: FlightPilotScore; pending: boolean }) {
  const percent = score ? percentNumber(score.score, score.totalPossible) : null;
  return (
    <span>
      <span className="flight-label">
        <span>{name}</span>
        <span>{score ? formatPercent(score.score, score.totalPossible) : pending ? "…" : "—"}</span>
      </span>
      <ScoreBar percent={percent} pulse={pending} />
    </span>
  );
}

function Star() {
  return (
    <span className="star">
      ★<span className="sr"> Qualifies for an IAC stars achievement award</span>
    </span>
  );
}
