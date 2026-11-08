export default function Loading() {
  return (
    <div className="wrap loading">
      <p className="kicker">IACCDB</p>
      <p>Reading the contest database…</p>
      <div className="loading-bar">
        <span />
      </div>
    </div>
  );
}
