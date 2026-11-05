import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, UserPlus, HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/use-current-user";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Painel — Karen Esteves" }, { name: "description", content: "Indicadores da clínica." }] }),
  component: Painel,
});

function Painel() {
  const { data: me } = useCurrentUser();
  const { data } = useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      const iso = monthStart.toISOString().slice(0, 10);
      const c = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
      const base = () => supabase.from("patients").select("id", { count: "exact", head: true });
      const [total, ativos, novos, acomp] = await Promise.all([
        c(base()),
        c(base().in("status", ["ativo", "em_acompanhamento"])),
        c(base().gte("entry_date", iso)),
        c(base().eq("status", "em_acompanhamento")),
      ]);
      return { total, ativos, novos, acomp };
    },
  });

  const cards = [
    { label: "Pacientes cadastrados", value: data?.total, icon: Users },
    { label: "Pacientes ativos", value: data?.ativos, icon: UserCheck },
    { label: "Novos neste mês", value: data?.novos, icon: UserPlus },
    { label: "Em acompanhamento", value: data?.acomp, icon: HeartPulse },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="text-3xl font-semibold text-primary">{me?.profile?.full_name || "bem-vinda(o)"}</h1>
        </div>
        <Button asChild><Link to="/pacientes/novo"><UserPlus /> Novo paciente</Link></Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <span className="rounded-full bg-secondary p-2 text-primary"><c.icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-3 font-serif text-4xl font-semibold text-foreground">{c.value ?? "—"}</p>
          </div>
        ))}
      </div>
      <p className="rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
        Indicadores de agenda, presença, anamneses e gráficos serão ativados nas próximas etapas, assim que esses módulos forem construídos.
      </p>
    </div>
  );
}
