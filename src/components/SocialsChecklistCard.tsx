import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Section } from "@/components/StatsOverview";
import { SocialsWeekGrid } from "@/components/SocialsWeekGrid";

/** Week view of the Review Hub checklist, live from the same rows. */
export function SocialsChecklistCard({ className, weekOnly }: { className?: string; weekOnly?: boolean }) {
  return (
    <Section title="Socials-checklist" className={className} aside={
      <Link to="/hibe/socials" className="chip-filter h-8 gap-1 px-3 text-xs">Volledige checklist<ArrowUpRight className="h-3.5 w-3.5" /></Link>
    }>
      <SocialsWeekGrid weekOnly={weekOnly} />
    </Section>
  );
}
