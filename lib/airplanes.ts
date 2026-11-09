export type AirplaneKind = "power" | "glider" | "unknown";

export type AirplaneIdentity = {
  /** Stable id used for filters, counts, and cached pictures. */
  id: string;
  /** Name shown in filters and lists. */
  name: string;
  kind: AirplaneKind;
  /** True when a known aerobatic type matched, false for a cleaned leftover. */
  known: boolean;
  /** Make and model as the contest entry typed them. */
  entered: string;
};

type Rule = {
  id: string;
  name: string;
  kind: AirplaneKind;
  test: (blob: string, compact: string) => boolean;
};

const RULES: Rule[] = [
  { id: "extra-ng", name: "Extra NG", kind: "power", test: (b) => has(b, "extra") && has(b, "ng") },
  { id: "extra-330sc", name: "Extra 330SC", kind: "power", test: (_, c) => /330sc/.test(c) },
  { id: "extra-330lx", name: "Extra 330LX", kind: "power", test: (_, c) => /330lx|e330lx/.test(c) },
  { id: "extra-330lt", name: "Extra 330LT", kind: "power", test: (_, c) => /330lt/.test(c) },
  { id: "extra-330sx", name: "Extra 330SX", kind: "power", test: (_, c) => /330sx|330lc/.test(c) },
  { id: "extra-300sc", name: "Extra 300SC", kind: "power", test: (_, c) => /300sc|300sce|ea300sc|ea300sx/.test(c) },
  { id: "extra-300l", name: "Extra 300L", kind: "power", test: (_, c) => /300lp|300l|ea300l|e300l|ea300$/.test(c) },
  { id: "extra-300s", name: "Extra 300S", kind: "power", test: (_, c) => /300s/.test(c) && !/300sc/.test(c) },
  { id: "extra-200", name: "Extra 200", kind: "power", test: (b, c) => has(b, "extra") && /(?:^|[^0-9])200(?:[^0-9]|$)/.test(c) },
  { id: "extra-300", name: "Extra 300", kind: "power", test: (b, c) => (has(b, "extra") || /ea300|e300/.test(c)) && /300/.test(c) },
  { id: "extra", name: "Extra", kind: "power", test: (b) => has(b, "extra") },

  { id: "pitts-12", name: "Pitts Model 12", kind: "power", test: (b, c) => has(b, "pitts") && (/model12|pitts12/.test(c) || has(b, "12")) },
  { id: "pitts-s2b", name: "Pitts S-2B", kind: "power", test: (b, c) => has(b, "pitts") && /s2b/.test(c) },
  { id: "pitts-s2c", name: "Pitts S-2C", kind: "power", test: (b, c) => has(b, "pitts") && /s2c/.test(c) },
  { id: "pitts-s2a", name: "Pitts S-2A", kind: "power", test: (b, c) => has(b, "pitts") && /s2a/.test(c) },
  { id: "pitts-s2s", name: "Pitts S-2S", kind: "power", test: (b, c) => has(b, "pitts") && /s2s/.test(c) },
  { id: "pitts-s1s", name: "Pitts S-1S", kind: "power", test: (b, c) => has(b, "pitts") && /s1s|s1sx/.test(c) },
  { id: "pitts-s1t", name: "Pitts S-1T", kind: "power", test: (b, c) => has(b, "pitts") && /s1t/.test(c) },
  { id: "pitts-s1c", name: "Pitts S-1C", kind: "power", test: (b, c) => has(b, "pitts") && /s1c/.test(c) },
  { id: "pitts-s1e", name: "Pitts S-1E", kind: "power", test: (b, c) => has(b, "pitts") && /s1e/.test(c) },
  { id: "pitts-s1", name: "Pitts S-1", kind: "power", test: (b, c) => has(b, "pitts") && (/s1(?![0-9a-z])/.test(c) || /s111/.test(c)) },
  { id: "pitts", name: "Pitts Special", kind: "power", test: (b) => has(b, "pitts") },

  { id: "xa42", name: "XtremeAir XA42", kind: "power", test: (b) => /xa42|xtremeair|sbach/.test(b) },
  { id: "xtreme-decathlon", name: "Xtreme Decathlon", kind: "power", test: (b) => /xtreme|extreme/.test(b) && /decathlon|8kcab/.test(b) },
  { id: "super-decathlon", name: "Super Decathlon", kind: "power", test: (b) => /superd/.test(b) || (/super/.test(b) && /decathlon|8kcab|decath/.test(b)) },
  { id: "super-decathlon", name: "Super Decathlon", kind: "power", test: (b, c) => /8kcab/.test(c) && !/citabria|7gcbc|7eca/.test(c) && !/decathlon/.test(b) },
  { id: "decathlon", name: "Decathlon", kind: "power", test: (b) => /decathlon/.test(b) },
  { id: "citabria", name: "Citabria", kind: "power", test: (b) => /citabria|7gcbc|7eca/.test(b) },

  { id: "gamebird", name: "Game Composites GB1 Gamebird", kind: "power", test: (b, c) => /gamebird|gamecomposite|gameaerospace|gb1/.test(c) || has(b, "gamebird") },

  { id: "christen-eagle", name: "Christen Eagle", kind: "power", test: (b) => /eagle/.test(b) && /christen|aviat|eagle/.test(b) && !/legal/.test(b) },

  { id: "dg-1001", name: "DG-1001", kind: "glider", test: (_, c) => /dg1001|1001/.test(c) && /dg|flugzeug/.test(c) },
  { id: "dg-1001", name: "DG-1001", kind: "glider", test: (b, c) => has(b, "dg") && /1001/.test(c) },
  { id: "dg-1000", name: "DG-1000", kind: "glider", test: (b, c) => (/dg1000/.test(c) || (has(b, "dg") && /1000/.test(c))) },
  { id: "dg-300", name: "DG-300", kind: "glider", test: (_, c) => /dg300/.test(c) },
  { id: "dg-800", name: "DG-800", kind: "glider", test: (_, c) => /dg800|dg808/.test(c) },

  { id: "fox", name: "MDM-1 Fox", kind: "glider", test: (b, c) => /fox/.test(b) && /mdm/.test(c) },
  { id: "swift-s1", name: "Swift S-1", kind: "glider", test: (b) => /swift|swfit/.test(b) },

  { id: "edge-540", name: "Zivko Edge 540", kind: "power", test: (b) => /edge/.test(b) && /540|zivko/.test(b) },
  { id: "rebel-2300", name: "Rebel 2300", kind: "power", test: (b) => /rebel/.test(b) },
  { id: "mx2", name: "MX2", kind: "power", test: (b, c) => /mx2|mxaircraft/.test(c) && !/mxs/.test(c) || (has(b, "mx") && has(b, "2") && !/mxs/.test(c)) },
  { id: "mxs", name: "MXS", kind: "power", test: (_, c) => /mxs/.test(c) },
  { id: "panzl-s330", name: "Panzl S-330", kind: "power", test: (b, c) => has(b, "panzl") || /s330/.test(c) && has(b, "panzl") },
  { id: "giles-202", name: "Giles G-202", kind: "power", test: (b, c) => /g202|giles202|202/.test(c) && /giles|akrotek|panzer/.test(b) },
  { id: "giles-200", name: "Giles G-200", kind: "power", test: (b) => /giles/.test(b) && /200|g200/.test(b) },
  { id: "one-design", name: "DR-107 One Design", kind: "power", test: (b) => /one design|dr107|rihn|rhin/.test(b) },
  { id: "staudacher-300", name: "Staudacher S-300", kind: "power", test: (b) => /staudacher/.test(b) && /300/.test(b) },
  { id: "staudacher-600", name: "Staudacher S-600", kind: "power", test: (b) => /staudacher/.test(b) && /600/.test(b) },
  { id: "yak-55", name: "Yak-55", kind: "power", test: (b) => /yak/.test(b) && /55/.test(b) },
  { id: "su-26", name: "Sukhoi Su-26", kind: "power", test: (b, c) => /su26|sukhoi/.test(c) || (has(b, "sukhoi") && /26/.test(b)) },
  { id: "laser-230", name: "Laser 230", kind: "power", test: (b) => /laser|lazer/.test(b) && /230|2300/.test(b) },
  { id: "laser-200", name: "Laser 200", kind: "power", test: (b) => /laser|lazer/.test(b) && /200|210/.test(b) },
  { id: "cap-232", name: "Mudry CAP 232", kind: "power", test: (b) => /cap/.test(b) && /232|mudry/.test(b) },
  { id: "integral", name: "Aura Aero Integral", kind: "power", test: (b) => /integral|aura/.test(b) },
  { id: "jungmann", name: "Bücker Jungmann", kind: "power", test: (b) => /jungmann|bucker|bu131/.test(b) },
  { id: "great-lakes", name: "Great Lakes", kind: "power", test: (b) => /great lakes|2t1a/.test(b) },
  { id: "cj6", name: "Nanchang CJ-6", kind: "power", test: (b) => /nanchang|cj6/.test(b) },
  { id: "j3", name: "Piper J-3 Cub", kind: "power", test: (b) => has(b, "piper") || /\bj3\b/.test(b) },
  { id: "skybolt", name: "Steen Skybolt", kind: "power", test: (b) => /skybolt|steen/.test(b) },
  { id: "xa42", name: "XtremeAir XA42", kind: "power", test: (b) => /xa42|xtremeair|sbach/.test(b) },
  { id: "ss300", name: "Treat Super Solution", kind: "power", test: (b) => /super solution|ss300|treat/.test(b) },
  { id: "rv-14", name: "Van's RV-14", kind: "power", test: (_, c) => /rv14/.test(c) },
  { id: "rv-8", name: "Van's RV-8", kind: "power", test: (_, c) => /rv8/.test(c) },
  { id: "rv-7", name: "Van's RV-7", kind: "power", test: (_, c) => /rv7/.test(c) },
  { id: "rv-6", name: "Van's RV-6", kind: "power", test: (_, c) => /rv6/.test(c) },
  { id: "rv-4", name: "Van's RV-4", kind: "power", test: (_, c) => /rv4/.test(c) },
  { id: "rv", name: "Van's RV", kind: "power", test: (b, c) => /rv/.test(c) && /van/.test(b) },
];

export function identifyAirplane(make?: string | null, model?: string | null): AirplaneIdentity {
  const entered = cleanEntered(make, model);
  if (!entered) {
    return { id: "unknown", name: "Unknown airplane", kind: "unknown", known: false, entered: "" };
  }
  const blob = squash(entered);
  const compact = blob.replace(/ /g, "");
  for (const rule of RULES) {
    if (rule.test(blob, compact)) {
      return { id: rule.id, name: rule.name, kind: rule.kind, known: true, entered };
    }
  }
  return {
    id: `other-${slug(blob)}`,
    name: titleCase(entered),
    kind: /glider|dg |ask|asw|szd|fox|swift|discus|ventus/.test(blob) ? "glider" : "unknown",
    known: false,
    entered,
  };
}

export function cleanEntered(make?: string | null, model?: string | null): string {
  const parts = [make, model]
    .map((value) => (value ?? "").replace(/\s+/g, " ").trim())
    .filter((value) => value && !/^tbd$/i.test(value) && !/^n\/?a$/i.test(value));
  if (parts.length === 2 && squash(parts[0]) === squash(parts[1])) return parts[0];
  return parts.join(" ");
}

function squash(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/piits/g, "pitts")
    .replace(/decathalon/g, "decathlon")
    .replace(/swfit/g, "swift")
    .replace(/flugzeubau/g, "flugzeugbau")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function has(blob: string, token: string): boolean {
  return ` ${blob} `.includes(` ${token} `);
}

function slug(blob: string): string {
  return blob.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => (word.length <= 3 && /[A-Z]/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}
