"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScoreBar } from "@/components/ScoreBar";
import { placeWord } from "@/lib/format";
import { formatMean, pilotStats } from "@/lib/pilot-stats";
import type { PilotHit, PilotProfile } from "@/lib/types";

export function PilotSearch() {
  const [query, setQuery] = useState("");
  const [pilots, setPilots] = useState<PilotHit[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [preview, setPreview] = useState<PilotProfile | null>(null);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setPilots([]);
      setTotal(0);
      setStatus("idle");
      setSelectedId(null);
      setPreview(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setStatus("loading");
      fetch(`/api/pilots?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("search failed");
          return (await response.json()) as { total: number; pilots: PilotHit[] };
        })
        .then((data) => {
          setPilots(data.pilots);
          setTotal(data.total);
          setStatus("done");
          setSelectedId(data.pilots[0]?.id ?? null);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setStatus("error");
        });
    }, 180);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (selectedId == null) {
      setPreview(null);
      setPreviewStatus("idle");
      return;
    }
    const controller = new AbortController();
    setPreviewStatus("loading");
    fetch(`/api/pilots/${selectedId}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("profile failed");
        return (await response.json()) as PilotProfile;
      })
      .then((profile) => {
        setPreview(profile);
        setPreviewStatus("done");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPreviewStatus("error");
      });
    return () => controller.abort();
  }, [selectedId]);

  const stats = preview && previewStatus === "done" ? pilotStats(preview) : null;

  return (
    <section>
      <p className="kicker">Pilot index</p>
      <h1 className="contest-title">Find a pilot</h1>
      <p className="lede">
        Search the IACCDB roster by name. The first match opens with real contest percentages, ranks, and category
        averages.
      </p>
      <form className="search search-large" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="sr" htmlFor="pilot-q">
          Pilot name
        </label>
        <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5 L14 14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <input
          id="pilot-q"
          type="search"
          value={query}
          placeholder="Search by name"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>
      <p className="hint" aria-live="polite">
        {status === "idle" ? "Type at least two letters." : null}
        {status === "loading" ? "Searching the pilot index…" : null}
        {status === "error" ? "The pilot index could not be loaded." : null}
        {status === "done"
          ? `${total} ${total === 1 ? "pilot matches" : "pilots match"}${total > pilots.length ? `. Showing ${pilots.length}.` : "."}`
          : null}
      </p>
      <div className="search-layout">
        <ul className="hits">
          {pilots.map((pilot) => (
            <li key={pilot.id}>
              <button
                type="button"
                className={pilot.id === selectedId ? "hit is-on" : "hit"}
                aria-pressed={pilot.id === selectedId}
                onClick={() => setSelectedId(pilot.id)}
              >
                <span className="pilot-name">{pilot.name}</span>
                <span className="meta">Show results</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="preview">
          {status === "done" && pilots.length === 0 ? (
            <div className="empty">
              <h2>No pilot by that name</h2>
              <p>The IACCDB roster did not include a match.</p>
            </div>
          ) : null}
          {previewStatus === "loading" ? <p className="note">Loading contest scores…</p> : null}
          {previewStatus === "error" ? <p className="note">That pilot’s contest record could not be loaded.</p> : null}
          {preview && stats && previewStatus === "done" ? (
            <div>
              <p className="kicker">{stats.iacId != null ? `IAC ${stats.iacId}` : "Pilot"}</p>
              <h2 className="section-title">{preview.name}</h2>
              <dl className="summary-grid">
                <div>
                  <dt>Contests</dt>
                  <dd>{stats.contestCount}</dd>
                </div>
                <div>
                  <dt>Average</dt>
                  <dd>{formatMean(stats.averagePercent)}</dd>
                </div>
                <div>
                  <dt>Best finish</dt>
                  <dd>{stats.bestFinish?.rank != null ? placeWord(stats.bestFinish.rank) : "—"}</dd>
                </div>
              </dl>
              <ul className="form-chart">
                {stats.recent.map((result) => (
                  <li key={`${result.contestId}-${result.categoryName}`}>
                    <div className="form-row">
                      <span>
                        {result.contestName}
                        <span className="meta"> {result.categoryName}</span>
                      </span>
                      <ScoreBar percent={result.percent} />
                      <span className="form-pct">
                        {result.percentLabel}
                        {result.rank != null ? ` · ${placeWord(result.rank)}` : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <Link className="btn" href={`/pilots/${preview.id}`}>
                Open full profile
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
