import { PageHeader } from "@/components/PageHeader";
import { SocialsWeekGrid } from "@/components/SocialsWeekGrid";

export default function HibeSocials() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-8">
      <div>
        <PageHeader title="Socials-checklist" />
        <p className="text-sm text-muted-foreground">Live gekoppeld aan de checklist in HIBE Review Hub — wijzigingen staan direct op beide sites.</p>
      </div>
      <section className="rounded-lg bg-card p-4 md:p-7">
        <SocialsWeekGrid />
      </section>
    </div>
  );
}
