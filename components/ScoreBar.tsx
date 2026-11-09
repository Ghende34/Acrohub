export function ScoreBar({ percent, pulse = false }: { percent: number | null; pulse?: boolean }) {
  const width = percent == null ? 0 : Math.max(0, Math.min(100, percent));
  return (
    <div className={pulse ? "bar pulse" : "bar"} aria-hidden="true">
      <span style={{ width: pulse ? undefined : `${width}%` }} />
    </div>
  );
}
