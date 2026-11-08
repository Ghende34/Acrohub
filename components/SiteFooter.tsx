import { IACCDB_ORIGIN, notesUrl } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <p className="footer-brand">Acrohub</p>
          <p>Unofficial viewer of IAC contest results. Not affiliated with the International Aerobatic Club.</p>
        </div>
        <div>
          <p>
            Data from the <a href={IACCDB_ORIGIN}>IAC Contest Database</a>. Contest, pilot, and flight links open the
            matching IACCDB pages.
          </p>
          <p>
            Official results are from the 2014 contest year onward. Earlier years are archival computations published
            by IACCDB for study.
          </p>
          <p>
            <a href={notesUrl()}>How IACCDB explains its numbers</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
