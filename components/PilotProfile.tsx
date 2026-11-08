"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink } from "@/components/ExternalLink";
import { ScoreBar } from "@/components/ScoreBar";
import { contestUrl, pilotUrl } from "@/lib/constants";
import { dateParts, formatPoints, formatPossible, isArchivalYear, placeWord, regionLabel, yearFromDate } from "@/lib/format";
import { formatMean, pilotStats, profileYears } from "@/lib/pilot-stats";
import type { PilotProfile as PilotProfileData } from "@/lib/types";

export function PilotProfile({ profile }: { profile: PilotProfileData }) {
  const years = useMemo(() => profileYears(profile), [profile]);
  const [year, setYear] = useState<number | null>(null);
  const stats = useMemo(() => pilotStats(profile, year), [profile, year]);
  const seasonChart = useMemo(() => pilotStats(profile).byYear, [profile]);
  const visible = year ? profile.appearances.filter((appearance) => appearance.date.startsWith(String(year))) : profile.appearances;
  const limited = profile.fetchedScoreCount < profile.totalAppearances;

  return (
    <article>
      <p className="kicker">Pilot</p>
      <h1 className="contest-title">{profile.name}</h1>
      <div className="facts">
        {stats.iacId != null ? <span className="fact">{`IAC ${stats.iacId}`}</span> : null}
        {stats.chapter ? <span className="fact">{`Chapter ${stats.chapter}`}</span> : null}
        <span className="fact">{`${stats.contestCount} ${stats.contestCount === 1 ? "contest" : "contests"}`}</span>
      </div>
      <p className="lede">
        Contest history from the IACCDB pilot page. Averages are the mean of category percentages on scored appearances.
        They are not an official ranking.
      </p>
      <div className="actions">
        <ExternalLink href={pilotUrl(profile.id)}>Open on IACCDB</ExternalLink>
        <Link href="/pilots">Search again</Link>
      </div>
      <div className="chips" role="group" aria-label="Season" style={{ marginTop: "1rem" }}>
        <button type="button" className={year == null ? "chip is-on" : "chip"} aria-pressed={year == null} onClick={() => setYear(null)}>
          All seasons
        </button>
        {years.map((item) => (
          <button key={item} type="button" className={year === item ? "chip is-on" : "chip"} aria-pressed={year === item} onClick={() => setYear(item)}>
            {item}
          </button>
        ))}
      </div>
      {limited ? (
        <p className="note" style={{ marginTop: "0.8rem" }}>
          Scores are loaded for the {profile.fetchedScoreCount} most recent appearances. Older contests stay on the list
          without a percentage. Averages use only appearances that have a loaded score.
        </p>
      ) : null}
      {stats.horsConcoursExcluded > 0 ? (
        <p className="note">Hors concours results stay in the history and are left out of averages and best finish.</p>
      ) : null}

      <dl className="summary-grid">
        <div>
          <dt>Scored results</dt>
          <dd>{stats.scoredCount}</dd>
        </div>
        <div>
          <dt>Average percent</dt>
          <dd>{formatMean(stats.averagePercent)}</dd>
        </div>
        <div>
          <dt>Best finish</dt>
          <dd>{stats.bestFinish?.rank != null ? placeWord(stats.bestFinish.rank) : "—"}</dd>
          {stats.bestFinish ? <p className="meta">{stats.bestFinish.contestName}</p> : null}
        </div>
        <div>
          <dt>Best percent</dt>
          <dd>{stats.bestPercent ? stats.bestPercent.percentLabel : "—"}</dd>
          {stats.bestPercent ? <p className="meta">{stats.bestPercent.categoryName}</p> : null}
        </div>
      </dl>

      {seasonChart.length > 0 && year == null ? (
        <section>
          <h2 className="section-title">By season</h2>
          <ul className="form-chart">
            {seasonChart.map((row) => (
              <li key={row.label}>
                <button type="button" className="form-row" onClick={() => setYear(Number(row.label))}>
                  <span>{row.label}</span>
                  <ScoreBar percent={row.averagePercent} />
                  <span className="form-pct">{formatMean(row.averagePercent)}</span>
                </button>
                <span className="meta">
                  {row.count} scored {row.count === 1 ? "result" : "results"}
                  {row.bestRank != null ? ` · best ${placeWord(row.bestRank)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stats.byCategory.length > 0 ? (
        <section>
          <h2 className="section-title">By category</h2>
          <ul className="form-chart">
            {stats.byCategory.map((row) => (
              <li key={row.label}>
                <div className="form-row">
                  <span>{row.label}</span>
                  <ScoreBar percent={row.averagePercent} />
                  <span className="form-pct">{formatMean(row.averagePercent)}</span>
                </div>
                <span className="meta">
                  {row.count} scored {row.count === 1 ? "result" : "results"}
                  {row.bestRank != null ? ` · best ${placeWord(row.bestRank)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stats.recent.length > 0 ? (
        <section>
          <h2 className="section-title">Recent form</h2>
          <ul className="form-chart">
            {stats.recent.map((result) => (
              <li key={`${result.contestId}-${result.categoryName}`}>
                <div className="form-row">
                  <span>
                    {dateParts(result.date).label}
                    <span className="meta"> {result.contestName}</span>
                  </span>
                  <ScoreBar percent={result.percent} />
                  <span className="form-pct">{result.percentLabel}</span>
                </div>
                <span className="meta">
                  {result.categoryName}
                  {result.rank != null ? ` · ${placeWord(result.rank)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="section-title">Contest history</h2>
        {visible.length === 0 ? (
          <div className="empty">
            <h2>No contest appearances</h2>
            <p>The IACCDB pilot page does not list a contest for this filter.</p>
          </div>
        ) : (
          <ul className="appearance-list">
            {visible.map((appearance) => {
              const date = dateParts(appearance.date);
              const appearanceYear = yearFromDate(appearance.date);
              return (
                <li key={`${appearance.contestId}-${appearance.categoryName}`} className="appearance" data-testid="pilot-result">
                  <div>
                    <p className="kicker">{date.label}</p>
                    <h2>
                      <Link href={`/contests/${appearance.contestId}`}>{appearance.contestName}</Link>
                    </h2>
                    <p className="meta">
                      {regionLabel(appearance.region)} · {appearance.categoryName}
                    </p>
                    <div className="tags">
                      {appearanceYear != null && isArchivalYear(appearanceYear) ? <span className="tag">Archival</span> : null}
                      {appearance.score?.starQualifying ? <span className="tag">Stars qualifier</span> : null}
                      {appearance.score?.horsConcours ? <span className="tag">Hors concours</span> : null}
                    </div>
                    <p className="detail-links" style={{ marginTop: "0.45rem" }}>
                      <Link href={`/pilots/${profile.id}/scores/${appearance.contestId}`}>Score sheets</Link>
                      <ExternalLink href={contestUrl(appearance.contestId)}>Contest on IACCDB</ExternalLink>
                    </p>
                  </div>
                  <div className="score-block">
                    {appearance.score ? (
                      <>
                        <p className="total-pct">{appearance.score.percent}</p>
                        <p className="meta">
                          {appearance.score.rank != null ? placeWord(appearance.score.rank) : "Rank not posted"} ·{" "}
                          {formatPoints(appearance.score.points)} of {formatPossible(appearance.score.totalPossible)}
                        </p>
                        <p className="meta">
                          {appearance.score.airplane}
                          {appearance.score.reg ? ` · ${appearance.score.reg}` : ""}
                        </p>
                        <div style={{ marginTop: "0.4rem" }}>
                          <ScoreBar percent={Number.parseFloat(appearance.score.percent)} />
                        </div>
                      </>
                    ) : (
                      <p className="meta">{statusCopy(appearance.scoreStatus)}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}

function statusCopy(status: PilotProfileData["appearances"][number]["scoreStatus"]): string {
  if (status === "not-fetched") return "Listed from the pilot page. Score not loaded in this view.";
  if (status === "missing") return "The contest record did not include this pilot in that category.";
  if (status === "unavailable") return "The contest record could not be loaded.";
  return "Score not posted.";
}
