import Link from "next/link";
import { AirplaneFace } from "@/components/AirplaneFace";
import { airplaneLine, placeWord } from "@/lib/format";
import type { ScoresheetView } from "@/lib/iaccdb";
import type { Mark } from "@/lib/scoresheet";

export function ScoresheetTable({ view }: { view: ScoresheetView }) {
  const { sheet } = view;
  const judgeCount = view.judges.length;
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
        <AirplaneFace make={view.airplane.make} model={view.airplane.model} reg={view.airplane.reg} size="full" />
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
              {sheet.figures.map((figure) => (
                <tr key={figure.label}>
                  <th scope="row">{figure.label}</th>
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
      </p>
    </section>
  );
}

function MarkCell({ mark }: { mark: Mark }) {
  const zero = mark.kind === "grade" && mark.label === "0.0";
  const className =
    mark.kind === "hard-zero" ? "mark mark-hz" : mark.kind === "grade" && zero ? "mark mark-zero" : mark.kind === "grade" ? "mark" : "mark mark-special";
  return <span className={className}>{mark.label}</span>;
}
