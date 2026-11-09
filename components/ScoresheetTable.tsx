"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AirplaneFace } from "@/components/AirplaneFace";
import { airplaneLine, placeWord } from "@/lib/format";
import type { ScoresheetView } from "@/lib/iaccdb";
import type { PlanePhoto } from "@/lib/airplane-media";
import type { FigureCaption } from "@/lib/sequence-card";
import type { Mark } from "@/lib/scoresheet";

export function ScoresheetTable({ view, tailPhoto }: { view: ScoresheetView; tailPhoto?: PlanePhoto | null }) {
  const { sheet } = view;
  const judgeCount = view.judges.length;
  const [uploaded, setUploaded] = useState<{ source: string; captions: FigureCaption[] } | null>(null);
  const storageKey = `acrohub-card:${view.pilotFlightId}`;

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const stored = JSON.parse(raw) as { source?: string; captions?: FigureCaption[]; k?: number[] };
      if (!stored.captions || stored.k?.join(",") !== view.kValues.join(",")) return;
      setUploaded({ source: stored.source || "Uploaded sequence card", captions: stored.captions });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey, view.kValues]);

  const captions = uploaded?.captions ?? view.captions;
  const source = uploaded?.source ?? view.captionSource;
  const derivedColumns = sheet.figures.some((figure) => figure.k != null) ? 3 : 0;
  return (
    <section className="sheet-block" data-testid="scoresheet">
      <header className="sheet-head">
        <p className="kicker">
          {view.categoryName || "Flight"}
          {view.contestYear ? ` · ${view.contestYear}` : ""}
        </p>
        <h2 className="section-title">
          {view.flightName} <span className="accent">scoresheet</span>
        </h2>
        <p className="lede sheet-identity">
          <span>{view.pilot.name}</span>
          {view.pilot.iacId != null ? <span>{`IAC ${view.pilot.iacId}`}</span> : null}
          <span>
            {airplaneLine(view.airplane.make, view.airplane.model)}
            {view.airplane.reg ? ` · ${view.airplane.reg}` : ""}
          </span>
          {view.rank != null ? <span>{placeWord(view.rank)} on this flight</span> : null}
          {view.horsConcours ? <span>Hors concours</span> : null}
        </p>
        <AirplaneFace make={view.airplane.make} model={view.airplane.model} reg={view.airplane.reg} size="full" tailPhoto={tailPhoto} />
        {source ? (
          <p className="note">
            {source === "Uploaded sequence card"
              ? "Figure names from a sequence card saved on this browser."
              : `Figure names filled in from the ${source}.`}{" "}
            Presentation stays presentation.
          </p>
        ) : null}
        <div className="actions">
          {view.contestId ? <Link href={`/contests/${view.contestId}`}>{view.contestName || "Contest"}</Link> : null}
          {view.flightId > 0 ? <Link href={`/flights/${view.flightId}`}>All pilots on this flight</Link> : null}
          {view.pilot.id > 0 ? <Link href={`/pilots/${view.pilot.id}`}>{view.pilot.name}</Link> : null}
        </div>
      </header>
      {sheet.figures.length === 0 ? (
        <div className="empty">
          <h2>No figure marks</h2>
          <p>This pilot flight record does not include grades.</p>
        </div>
      ) : (
        <div className="sheet-wrap">
          <table className="sheet">
            <thead>
              <tr>
                <th scope="col">Fig</th>
                {view.judges.map((judge, index) => (
                  <th key={`${judge.name}-${index}`} scope="col">
                    <span className="sheet-j">J{index + 1}</span>
                    <span className="sheet-judge">{judge.name}</span>
                    {judge.assistant ? <span className="sheet-assist">with {judge.assistant}</span> : null}
                  </th>
                ))}
                {derivedColumns > 0 ? (
                  <>
                    <th scope="col">Avg</th>
                    <th scope="col">K</th>
                    <th scope="col">Left</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {sheet.figures.map((figure, index) => (
                <tr key={figure.label}>
                  <th scope="row">
                    <span className="fig-id">{figure.label}</span>
                    {captions?.[index]?.name ? <span className="fig-name">{captions[index]?.name}</span> : null}
                    {captions?.[index]?.catalog ? <span className="fig-cat">{captions[index]?.catalog}</span> : null}
                  </th>
                  {figure.marks.map((mark, index) => (
                    <td key={index}>
                      <MarkCell mark={mark} />
                    </td>
                  ))}
                  {figure.k != null ? (
                    <>
                      <td>{figure.average}</td>
                      <td>{figure.k}</td>
                      <td>{figure.pointsLeft}</td>
                    </>
                  ) : null}
                </tr>
              ))}
              {sheet.judgeTotals.length > 0 ? (
                <tr className="sheet-summary">
                  <th scope="row">Points</th>
                  {sheet.judgeTotals.map((total, index) => (
                    <td key={index}>{total}</td>
                  ))}
                  <td colSpan={derivedColumns || 1}>{sheet.points}</td>
                </tr>
              ) : null}
              <tr className="sheet-summary">
                <th scope="row">Penalty</th>
                <td colSpan={judgeCount + derivedColumns}>{sheet.penalty}</td>
              </tr>
              <tr className="sheet-summary">
                <th scope="row">Points earned</th>
                <td colSpan={judgeCount + derivedColumns}>{sheet.pointsEarned ?? "—"}</td>
              </tr>
              <tr className="sheet-summary">
                <th scope="row">Max possible</th>
                <td colSpan={judgeCount + derivedColumns}>{sheet.maxPossible ?? "—"}</td>
              </tr>
              <tr className="sheet-summary">
                <th scope="row">Percent</th>
                <td colSpan={judgeCount + derivedColumns}>{sheet.percent ?? "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="note">
        Marks are the grades stored for this pilot flight. A is an average, CA is a conference average, and HZ is a hard
        zero. 0.0 is a numeric zero. Averages and points use IACCDB’s straight-average method. The last row is
        presentation.
        {source ? "" : " No published sequence matched this flight, so the rows stay numbered."}
      </p>
      <details className="card-fallback">
        <summary>Sequence card</summary>
        <p className="note">
          Free and Unknown sequences are not in the contest database. A card is only a fallback for this browser when the
          published sequence is missing.
        </p>
        <SequenceUpload
          pilotFlightId={view.pilotFlightId}
          kValues={view.kValues}
          storageKey={storageKey}
          onApply={(next) => setUploaded(next)}
          onClear={() => setUploaded(null)}
          hasUpload={uploaded != null}
        />
      </details>
    </section>
  );
}

function SequenceUpload({
  pilotFlightId,
  kValues,
  storageKey,
  onApply,
  onClear,
  hasUpload,
}: {
  pilotFlightId: number;
  kValues: number[];
  storageKey: string;
  onApply: (next: { source: string; captions: FigureCaption[] }) => void;
  onClear: () => void;
  hasUpload: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="card-upload"
      onSubmit={(event) => event.preventDefault()}
    >
      <label>
        Sequence card PDF
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={pending}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setPending(true);
            setError(null);
            const body = new FormData();
            body.set("file", file);
            body.set("k", kValues.join(","));
            try {
              const response = await fetch("/api/sequences/parse", { method: "POST", body });
              const data = (await response.json()) as { error?: string; source?: string; captions?: FigureCaption[] };
              if (!response.ok || !data.captions) {
                setError(data.error || "Names were not applied.");
                return;
              }
              const stored = { source: data.source || "Uploaded sequence card", captions: data.captions, k: kValues, pilotFlightId };
              window.localStorage.setItem(storageKey, JSON.stringify(stored));
              onApply({ source: stored.source, captions: stored.captions });
            } catch {
              setError("Could not read that PDF. Names were not applied.");
            } finally {
              setPending(false);
            }
          }}
        />
      </label>
      {hasUpload ? (
        <button
          type="button"
          className="chip"
          onClick={() => {
            window.localStorage.removeItem(storageKey);
            onClear();
            setError(null);
          }}
        >
          Remove uploaded names
        </button>
      ) : null}
      {error ? <p className="banner">{error}</p> : null}
    </form>
  );
}

function MarkCell({ mark }: { mark: Mark }) {
  const zero = mark.kind === "grade" && mark.label === "0.0";
  const className =
    mark.kind === "hard-zero" ? "mark mark-hz" : mark.kind === "grade" && zero ? "mark mark-zero" : mark.kind === "grade" ? "mark" : "mark mark-special";
  return <span className={className}>{mark.label}</span>;
}
