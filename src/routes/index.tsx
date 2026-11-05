import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import karen from "@/assets/karen-esteves.jpg.asset.json";
import { HeartHandshake, ShieldCheck, Sprout } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Karen Esteves — Cuidado, acolhimento e transformação" },
      {
        name: "description",
        content: "Plataforma clínica da terapeuta Karen Esteves para acolhimento e acompanhamento em dependência química.",
      },
      { property: "og:title", content: "Karen Esteves — Plataforma Clínica" },
      { property: "og:description", content: "Cuidado, acolhimento e transformação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-hero text-primary-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-6 py-16 md:flex-row md:gap-20">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-primary-soft/30 blur-2xl" />
          <img
            src={karen.url}
            alt="Karen Esteves"
            className="relative h-56 w-56 rounded-full border-4 border-primary-foreground/80 object-cover shadow-soft md:h-72 md:w-72"
          />
        </div>
        <div className="max-w-lg text-center md:text-left">
          <p className="text-sm uppercase tracking-[0.3em] text-primary-foreground/70">Plataforma clínica</p>
          <h1 className="mt-3 text-5xl font-semibold md:text-6xl">Karen Esteves</h1>
          <p className="mt-4 font-serif text-xl italic text-primary-foreground/85">
            Cuidado, acolhimento e transformação.
          </p>
          <ul className="mt-8 space-y-3 text-primary-foreground/85">
            <li className="flex items-center gap-3 justify-center md:justify-start"><HeartHandshake className="h-5 w-5" /> Acolhimento humanizado</li>
            <li className="flex items-center gap-3 justify-center md:justify-start"><Sprout className="h-5 w-5" /> Acompanhamento terapêutico contínuo</li>
            <li className="flex items-center gap-3 justify-center md:justify-start"><ShieldCheck className="h-5 w-5" /> Dados protegidos e sigilo profissional</li>
          </ul>
          <Button asChild size="lg" variant="secondary" className="mt-10 rounded-full px-10">
            <Link to="/auth">Acessar a plataforma</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
