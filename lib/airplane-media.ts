import { identifyAirplane, type AirplaneIdentity, type AirplaneKind } from "./airplanes";

export type PlanePhoto = {
  src: string;
  page: string;
  license: string;
  credit: string;
};

const RENDERING: Record<string, string> = {
  "extra-300": "/planes/extra-300l.jpg",
  "extra-300l": "/planes/extra-300l.jpg",
  "extra-300s": "/planes/extra-300l.jpg",
  "extra-300sc": "/planes/extra-300l.jpg",
  "extra-200": "/planes/extra-300l.jpg",
  "extra-ng": "/planes/extra-300l.jpg",
  extra: "/planes/extra-300l.jpg",
  "extra-330sc": "/planes/extra-330sc.jpg",
  "extra-330lx": "/planes/extra-330sc.jpg",
  "extra-330lt": "/planes/extra-330sc.jpg",
  "extra-330sx": "/planes/extra-330sc.jpg",
  "super-decathlon": "/planes/super-decathlon.jpg",
  decathlon: "/planes/super-decathlon.jpg",
  "xtreme-decathlon": "/planes/super-decathlon.jpg",
  citabria: "/planes/super-decathlon.jpg",
  gamebird: "/planes/gamebird.jpg",
  "christen-eagle": "/planes/christen-eagle.jpg",
  "pitts-s2b": "/planes/pitts.jpg",
  "pitts-s2c": "/planes/pitts.jpg",
  "pitts-s2a": "/planes/pitts.jpg",
  "pitts-s2s": "/planes/pitts.jpg",
  "pitts-s1s": "/planes/pitts.jpg",
  "pitts-s1t": "/planes/pitts.jpg",
  "pitts-s1c": "/planes/pitts.jpg",
  "pitts-s1e": "/planes/pitts.jpg",
  "pitts-s1": "/planes/pitts.jpg",
  "pitts-12": "/planes/pitts.jpg",
  pitts: "/planes/pitts.jpg",
  "dg-1000": "/planes/dg-1000.jpg",
  "dg-1001": "/planes/dg-1000.jpg",
  "dg-300": "/planes/dg-1000.jpg",
  "dg-800": "/planes/glider.jpg",
  fox: "/planes/fox.jpg",
  "swift-s1": "/planes/glider.jpg",
  "edge-540": "/planes/edge-540.jpg",
  mx2: "/planes/mx2.jpg",
  mxs: "/planes/mx2.jpg",
  "rv-4": "/planes/rv.jpg",
  "rv-6": "/planes/rv.jpg",
  "rv-7": "/planes/rv.jpg",
  "rv-8": "/planes/rv.jpg",
  "rv-14": "/planes/rv.jpg",
  rv: "/planes/rv.jpg",
};

const PHOTO: Record<string, PlanePhoto> = {
  "extra-300l": photo(
    "File:Extra EA 300 LC HB-MTS.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Extra_EA_300_LC_HB-MTS.jpg/960px-Extra_EA_300_LC_HB-MTS.jpg",
    "CC BY-SA 3.0",
    "Gzzz",
  ),
  "extra-330sc": photo(
    "File:Extra EA-300SHP at EAA AirVenture 2009.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Extra_EA-300SHP_at_EAA_AirVenture_2009.jpg/960px-Extra_EA-300SHP_at_EAA_AirVenture_2009.jpg",
    "GFDL 1.2",
    "Wikimedia Commons",
  ),
  "super-decathlon": photo(
    "File:American Champion 8KCAB Super Decathlon (N124SG, cn 1071-2008) (4-10-2024).jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/American_Champion_8KCAB_Super_Decathlon_%28N124SG%2C_cn_1071-2008%29_%284-10-2024%29.jpg/960px-American_Champion_8KCAB_Super_Decathlon_%28N124SG%2C_cn_1071-2008%29_%284-10-2024%29.jpg",
    "CC BY 4.0",
    "ZLEA",
  ),
  gamebird: photo(
    "File:Game Composites GB1 GameBird (N28GC, cn 0028) (7-29-2023).jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Game_Composites_GB1_GameBird_%28N28GC%2C_cn_0028%29_%287-29-2023%29.jpg/960px-Game_Composites_GB1_GameBird_%28N28GC%2C_cn_0028%29_%287-29-2023%29.jpg",
    "CC BY-SA 4.0",
    "ZLEA",
  ),
  "christen-eagle": photo(
    "File:Christen Eagle II N49AE EDST.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Christen_Eagle_II_N49AE_EDST.jpg/960px-Christen_Eagle_II_N49AE_EDST.jpg",
    "CC BY 4.0",
    "Julian Herzog",
  ),
  "pitts-s2b": photo(
    "File:VH-ZZZ Pitts Special S-2B (6772696639).jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/VH-ZZZ_Pitts_Special_S-2B_%286772696639%29.jpg/960px-VH-ZZZ_Pitts_Special_S-2B_%286772696639%29.jpg",
    "GFDL",
    "Robert Frola",
  ),
  "dg-1000": photo(
    "File:DG Flugzeugbau DG-1000S D-2371 Mikulovice.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/DG_Flugzeugbau_DG-1000S_D-2371_Mikulovice.jpg/960px-DG_Flugzeugbau_DG-1000S_D-2371_Mikulovice.jpg",
    "CC BY 4.0",
    "carsten karge",
  ),
  fox: photo(
    "File:MDM-1 FOX glider.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/MDM-1_FOX_glider.jpg/960px-MDM-1_FOX_glider.jpg",
    "CC BY-SA 4.0",
    "ZL Marganski",
  ),
  "edge-540": photo(
    "File:Fukushima Sky Park Yoshihide Muroya Zivko EDGE 540.JPG",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e2/Fukushima_Sky_Park_Yoshihide_Muroya_Zivko_EDGE_540.JPG/960px-Fukushima_Sky_Park_Yoshihide_Muroya_Zivko_EDGE_540.JPG",
    "CC BY-SA 3.0",
    "Cp9asngf",
  ),
  "rv-8": photo(
    "File:Van's RV-8 (VH-8RV) taxiing at Wagga Wagga Airport.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Van%27s_RV-8_%28VH-8RV%29_taxiing_at_Wagga_Wagga_Airport.jpg/960px-Van%27s_RV-8_%28VH-8RV%29_taxiing_at_Wagga_Wagga_Airport.jpg",
    "CC BY-SA 3.0 au",
    "Bidgee",
  ),
  "su-26": photo(
    "File:Red Sukhoi Su-26 at San Francisco Fleet Week 2026.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0e/Red_Sukhoi_Su-26_at_San_Francisco_Fleet_Week_2026.jpg/960px-Red_Sukhoi_Su-26_at_San_Francisco_Fleet_Week_2026.jpg",
    "CC BY 4.0",
    "E mln e",
  ),
};

const PHOTO_FAMILY: Record<string, string> = {
  "extra-300": "extra-300l",
  "extra-300s": "extra-300l",
  "extra-300sc": "extra-300l",
  "extra-200": "extra-300l",
  extra: "extra-300l",
  "extra-ng": "extra-300l",
  "extra-330lx": "extra-330sc",
  "extra-330lt": "extra-330sc",
  "extra-330sx": "extra-330sc",
  decathlon: "super-decathlon",
  "xtreme-decathlon": "super-decathlon",
  citabria: "super-decathlon",
  "pitts-s2c": "pitts-s2b",
  "pitts-s2a": "pitts-s2b",
  "pitts-s2s": "pitts-s2b",
  "pitts-s1s": "pitts-s2b",
  "pitts-s1t": "pitts-s2b",
  "pitts-s1c": "pitts-s2b",
  "pitts-s1e": "pitts-s2b",
  "pitts-s1": "pitts-s2b",
  "pitts-12": "pitts-s2b",
  pitts: "pitts-s2b",
  "dg-1001": "dg-1000",
  "dg-300": "dg-1000",
  "rv-4": "rv-8",
  "rv-6": "rv-8",
  "rv-7": "rv-8",
  "rv-14": "rv-8",
  rv: "rv-8",
};

export function airplaneMedia(identity: AirplaneIdentity): { rendering: string; photo: PlanePhoto } {
  const rendering =
    RENDERING[identity.id] ?? (identity.kind === "glider" ? "/planes/glider.jpg" : "/planes/monoplane.jpg");
  const photoKey = PHOTO[identity.id] ? identity.id : PHOTO_FAMILY[identity.id];
  const photo = (photoKey ? PHOTO[photoKey] : null) ?? fallbackPhoto(identity.kind);
  return { rendering, photo };
}

export function airplaneFromEntry(make?: string | null, model?: string | null): {
  identity: AirplaneIdentity;
  rendering: string;
  photo: PlanePhoto;
} {
  const identity = identifyAirplane(make, model);
  return { identity, ...airplaneMedia(identity) };
}

function fallbackPhoto(kind: AirplaneKind): PlanePhoto {
  if (kind === "glider") return PHOTO.fox;
  return PHOTO["extra-300l"];
}

function photo(title: string, src: string, license: string, credit: string): PlanePhoto {
  return {
    src,
    page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title).replace(/%20/g, "_")}`,
    license,
    credit,
  };
}
