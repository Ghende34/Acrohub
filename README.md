# Acrohub

Unofficial viewer of [IAC](https://www.iac.org) contest results. Acrohub reads the public [IAC Contest Database](https://iaccdb.iac.org/) and presents the same standings as a dark season board: contest cards, podiums, score bars, pilot search, and the regional series.

Acrohub is not affiliated with the International Aerobatic Club and does not use IAC branding. Official results are the 2014 contest year onward. Earlier years are the archival computations IACCDB already publishes.

## Preview locally

Requires Node.js 20 or newer.

```bash
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production mode:

```bash
npm run build && npm start
```

Unit tests (no network):

```bash
npm test
```

## What you can open

- `/` — contest year, search, region filter, and a card for every contest that year
- `/contests/1054` — category standings, podium, and judging comparison (Tequila Cup Glider is a useful glider example)
- `/pilots` — search the IACCDB pilot roster by name and preview real scores
- `/pilots/5136` — a pilot profile (Gavin Henderson, when the roster still lists him) with season and category averages
- `/scoresheets/176449` — a flight scoresheet (figure grades, K, averages, and totals) read inside Acrohub
- `/judges` — judge experience, with rank agreement and pair agreement
- `/stats` — highest averages, wins, best finishes, and best single scores for one contest year. Airplane filters use a canonical type, so Extra 300L, Pitts S-2B, and Super Decathlon spellings group together. A photo of that registration is shown beside a type rendering when a licensed or Airport-Data photo exists; otherwise the photo is labeled as a type example.
- A pilot page is a season book for one contest year: contests, category results, flights, in-app scoresheets, season average, best and weakest contest and flight, a trend, figure notes, and IACCDB star-qualifying flags
- Scoresheet figure names fill in on their own when the published IAC sequence for that year and category matches the flight’s K list. A sequence-card PDF is only a hidden fallback for a Free or Unknown that was never published
- `/watch` — a device watch list for contests and pilots. Acrohub checks the cached record about every 10 minutes while the site is open, and again when you return
- `/leaders` — regional series standings for the current contest year

If `has_results` is false, or a contest JSON has no `category_results`, the contest page says results have not been posted.

## Data

The browser never calls `iaccdb.iac.org` directly. That host does not send `Access-Control-Allow-Origin` on `contests.json`. Next.js loads IACCDB on the server and the client uses same-origin routes under `/api`:

- `/api/contests?year=2026`
- `/api/contests/:id`
- `/api/flights/:id`
- `/api/pilots?q=`
- `/api/pilots/:id`
- `/api/judges/leaders?year=2026`
- `/api/leaders/regionals?year=2026`

Responses are cached in memory for about 10 minutes, and identical requests already in flight are shared. Contest and flight links inside IACCDB JSON sometimes point at `http://localhost:3000`; those hosts are rewritten to `https://iaccdb.iac.org` before anything is rendered.

Contest standings come from `contests/{id}.json` (`category_value`, `total_possible`, `category_rank`, airplane, star, hors concours, judge gamma/rho). The percentage is points divided by total possible, rounded half-up to two decimals — the figure IACCDB prints. Per-flight scores come from `flights/{id}.json`.

Pilot search uses the HTML roster at `/pilots` (the `.json` variant returns 406). A pilot page is parsed from `/pilots/{id}`, then recent contest JSON is opened to attach that pilot’s category result. Profile averages are the mean of those published category percentages. They are not an official career ranking. Hors concours results stay on the history and are left out of the averages.

Judge metrics use the contest `judge_results` rollup and each flight’s `line_judges` record: Spearman rank agreement (ρ), Goodman and Kruskal gamma (γ), the CIVA ranking index when the flight includes it, and minority zero / minority grade counts. The judge experience page reads `/leaders/judges` and keeps the published figures. Short explanations follow the IACCDB notes.

Regional series pages are also HTML-only; Acrohub reads `/leaders/regionals` and shows the published percents as printed.

Every contest, pilot, flight, and series view links back to the matching IACCDB page.
