"use client";

import { useEffect, useState } from "react";
import { airplaneFromEntry } from "@/lib/airplane-media";
import type { PlanePhoto } from "@/lib/airplane-media";

export function AirplaneFace({
  make,
  model,
  reg,
  size = "compact",
}: {
  make?: string | null;
  model?: string | null;
  reg?: string | null;
  size?: "compact" | "full";
}) {
  const { identity, rendering, photo } = airplaneFromEntry(make, model);
  const [tail, setTail] = useState<PlanePhoto | null>(null);

  useEffect(() => {
    if (size !== "full" || !reg) return;
    const controller = new AbortController();
    fetch(`/api/planes/registration?reg=${encodeURIComponent(reg)}`, { signal: controller.signal })
      .then(async (response) => (response.ok ? ((await response.json()) as { photo?: PlanePhoto | null }) : null))
      .then((data) => {
        if (data?.photo) setTail(data.photo);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [reg, size]);

  const shown = tail ?? photo;
  const specific = Boolean(tail);
  return (
    <figure className={size === "full" ? "plane-face full" : "plane-face"}>
      <div className="plane-pair">
        <img src={shown.src} alt={`Photograph of a ${identity.name}`} />
        <img src={rendering} alt={`Rendering of a ${identity.name}`} />
      </div>
      <figcaption>
        <span>
          {identity.name}
          {reg ? ` · ${reg}` : ""}
        </span>
        <span>{specific ? "Photo of this registration." : "Type photo, not this contestant's paint scheme."} Rendering is an illustration of the type.</span>
        {identity.entered && identity.entered !== identity.name ? <span>Entered as {identity.entered}.</span> : null}
        <a href={shown.page} target="_blank" rel="noreferrer">
          {shown.credit}, {shown.license}
        </a>
      </figcaption>
    </figure>
  );
}
