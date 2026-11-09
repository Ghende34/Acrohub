import type { Metadata } from "next";
import { PilotSearch } from "@/components/PilotSearch";

export const metadata: Metadata = {
  title: "Pilots",
  description: "Search the IACCDB pilot roster and open contest results.",
};

export default function PilotsPage() {
  return (
    <div className="wrap stack">
      <PilotSearch />
    </div>
  );
}
