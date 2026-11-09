import Link from "next/link";
import { AirplaneFace } from "@/components/AirplaneFace";
import { ScoreBar } from "@/components/ScoreBar";
import { WatchButton } from "@/components/WatchButton";
import { ExternalLink } from "@/components/ExternalLink";
import { pilotUrl } from "@/lib/constants";
import { dateParts, formatPoints, formatPossible, isArchivalYear, placeWord, regionLabel } from "@/lib/format";
import { formatMean } from "@/lib/pilot-stats";
import type { SeasonBook as SeasonBookData } from "@/lib/season-book";
import type { PilotProfile } from "@/lib/types";

export function SeasonBook({
  profile,
  book,
  years,
}: {
  profile: PilotProfile;
  book: SeasonBookData;
  years: number[];
}) {
  const peak = Math.max(100, ...book.trend.map((item) => item.percent));

  return (
    <article>
      <p className="kicker">Season book · {book.year}</p>
      <h1 className="contest-title">{profile.name}</h1>
      <div className="facts">
        {profile.appearances.find((item) => item.score?.iacId != null)?.score?.iacId != null ? (
          <span className="fact">{`IAC ${profile.appearances.find((item) => item.score?.iacId != null)?.score?.iacId}`}</span>
        ) : null}
        <span className="fact">{`${book.contests.length} ${book.contests.length === 1 ? "contest" : "contests"} in ${book.year}`}</span>
      </div>
      <p className="lede">
        {book.year} as flown: each contest, category result, and flight, with the scoresheet inside Acrohub. The season
        average is the mean of category percentages. Hors concours results stay in the book and are left out of the
        average. This is not an official ranking.
      </p>
      <div className="actions">
        <WatchButton kind="pilot" id={profile.id} name={profile.name} />
        <ExternalLink href={pilotUrl(profile.id)}>Open on IACCDB</ExternalLink>
        <Link href="/pilots">Search again</Link>
        <Link href="/watch">Watch list</Link>
      </div>
      <div className="chips" role="group" aria-label="Season" style={{ marginTop: "1rem" }}>
        {years.map((year) => (
          <Link key={year} href={`/pilots/${profile.id}?year=${year}`} className={year === book.year ? "chip is-on" : "chip"} aria-current={year === book.year ? "page" : undefined}>
            {year}
          </Link>
        ))}
      </div>
      {isArchivalYear(book.year) ? (
        <p className="banner">This season is before 2014. IACCDB publishes those scores as archival computations.</p>
      ) : null}

      <dl className="summary-grid">
        <div>
          <dt>Season average</dt>
          <dd>{formatMean(book.average)}</dd>
          <p className="meta">{`${book.scoredCount} scored ${book.scoredCount === 1 ? "result" : "results"}`}</p>
        </div>
        <div>
          <dt>Best contest</dt>
          <dd>{book.bestContest?.percentLabel ?? "—"}</dd>
          {book.bestContest ? <p className="meta">{book.bestContest.name}</p> : null}
        </div>
        <div>
          <dt>Weakest contest</dt>
          <dd>{book.weakestContest?.percentLabel ?? "—"}</dd>
          {book.weakestContest ? <p className="meta">{book.weakestContest.name}</p> : null}
        </div>
        <div>
          <dt>Best flight</dt>
          <dd>{book.bestFlight?.percentLabel ?? "—"}</dd>
          {book.bestFlight ? <p className="meta">{`${book.bestFlight.name} · ${book.bestFlight.contestName}`}</p> : null}
        </div>
        <div>
          <dt>Weakest flight</dt>
          <dd>{book.weakestFlight?.percentLabel ?? "—"}</dd>
          {book.weakestFlight ? <p className="meta">{`${book.weakestFlight.name} · ${book.weakestFlight.contestName}`}</p> : null}
        </div>
        <div>
          <dt>Star-qualifying flags</dt>
          <dd>{book.stars.length}</dd>
          <p className="meta">As marked by IACCDB</p>
        </div>
      </dl>

      {book.trend.length > 0 ? (
        <section>
          <h2>Trend</h2>
          <ol className="form-chart">
            {book.trend.map((item) => (
              <li key={`${item.contestId}-${item.date}`}>
                <span>{item.contestName}</span>
                <span className="form-track" aria-hidden="true">
                  <span style={{ width: `${(item.percent / peak) * 100}%` }} />
                </span>
                <strong>{item.percent.toFixed(2)}%</strong>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section>
        <h2>Star flags</h2>
        <p className="note">
          IACCDB marked {book.stars.length} of {book.contests.length} category {book.contests.length === 1 ? "result" : "results"} this
          season as star-qualifying. Acrohub repeats that flag. It does not issue or administer IAC stars.
        </p>
        {book.stars.length > 0 ? (
          <ul className="clean">
            {book.stars.map((contest) => (
              <li key={contest.contestId}>
                <Link href={`/contests/${contest.contestId}`}>{contest.name}</Link>
                {` · ${contest.categoryName} · ${contest.percentLabel ?? "—"}`}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {book.strengths.length > 0 || book.weaknesses.length > 0 ? (
        <section className="two">
          <div>
            <h2>Stronger figures</h2>
            <FigureList figures={book.strengths} />
          </div>
          <div>
            <h2>Figures that gave up the most</h2>
            <FigureList figures={book.weaknesses} />
          </div>
        </section>
      ) : null}

      <section>
        <h2>Contests</h2>
        {book.contests.length === 0 ? (
          <div className="empty">
            <h2>No contests in {book.year}</h2>
            <p>This pilot has no IACCDB appearances dated in that year.</p>
          </div>
        ) : (
          <ol className="book">
            {book.contests.map((contest) => {
              const date = dateParts(contest.date);
              return (
                <li key={`${contest.contestId}-${contest.categoryName}`} className="book-contest">
                  <p className="kicker">{`${date.label} · ${regionLabel(contest.region)}`}</p>
                  <h3>
                    <Link href={`/contests/${contest.contestId}`}>{contest.name}</Link>
                  </h3>
                  <p className="meta">
                    {contest.categoryName}
                    {contest.rank != null ? ` · ${placeWord(contest.rank)}` : ""}
                    {contest.horsConcours ? " · hors concours" : ""}
                    {contest.starQualifying ? " · star-qualifying flag" : ""}
                  </p>
                  {contest.make || contest.reg ? (
                    <AirplaneFace make={contest.make} model={contest.model} reg={contest.reg} />
                  ) : null}
                  {contest.percent != null ? <ScoreBar percent={contest.percent} /> : null}
                  <p className="points">
                    {contest.percentLabel ?? "No percentage"}
                    {contest.points ? ` · ${formatPoints(contest.points)} / ${formatPossible(contest.totalPossible)}` : ""}
                  </p>
                  {contest.flights.length > 0 ? (
                    <ul className="flight-list">
                      {contest.flights.map((flight) => (
                        <li key={flight.pilotFlightId}>
                          <Link href={`/scoresheets/${flight.pilotFlightId}`}>{flight.name || "Flight"}</Link>
                          <span className="meta">
                            {flight.percentLabel ?? "—"}
                            {flight.rank != null ? ` · ${placeWord(flight.rank)} on the flight` : ""}
                          </span>
                          {flight.percent != null ? <ScoreBar percent={flight.percent} /> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="meta">Flight scoresheets are not in the published record for this appearance.</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
      {book.horsConcoursExcluded > 0 ? (
        <p className="note">Hors concours results are in the contest list and left out of the season average, best, and weakest.</p>
      ) : null}
    </article>
  );
}

function FigureList({ figures }: { figures: SeasonBookData["strengths"] }) {
  if (figures.length === 0) return <p className="meta">No figure averages in this season’s scoresheets.</p>;
  return (
    <ol className="clean">
      {figures.map((figure) => (
        <li key={`${figure.pilotFlightId}-${figure.figure}`}>
          <Link href={`/scoresheets/${figure.pilotFlightId}`}>{/^\d+$/.test(figure.figure) ? `Figure ${figure.figure}` : figure.figure}</Link>
          <span className="meta">{` ${figure.average.toFixed(1)} avg${figure.k != null ? ` · K ${figure.k}` : ""} · ${figure.flightName} · ${figure.contestName}`}</span>
        </li>
      ))}
    </ol>
  );
}
