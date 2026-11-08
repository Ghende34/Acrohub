"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="wrap stack">
      <div className="hold">
        <p className="kicker">Unavailable</p>
        <h2>Acrohub could not reach IACCDB</h2>
        <p>The contest database did not respond. Wait a moment and try again.</p>
        <button type="button" className="btn" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
