import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap stack">
      <div className="empty">
        <p className="kicker">404</p>
        <h2>Not on the board</h2>
        <p>That contest, pilot, or series is not in the IACCDB response.</p>
        <Link className="btn" href="/">
          Back to contests
        </Link>
      </div>
    </div>
  );
}
