import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calcAge } from "@/lib/roles";
import { PATIENT_STATUS } from "@/components/patient-form";

export const Route = createFileRoute("/_authenticated/pacientes/")({
  head: () => ({ meta: [{ title: "Pacientes — Karen Esteves" }, { name: "description", content: "Cadastro de pacientes." }] }),
  component: Pacientes,
});

function Pacientes() {
  const [q, setQ] = useState("");
  const term = q.trim();
  const { data, isLoading } = useQuery({
    queryKey: ["patients", term],
    queryFn: async () => {
      let query = supabase.from("patients").select("id, code, full_name, social_name, birth_date, category, status").order("full_name").limit(200);
      if (term) {
        const safe = term.replace(/[%,()]/g, "");
        const digits = safe.replace(/\D/g, "");
        const ors = [`full_name.ilike.%${safe}%`, `social_name.ilike.%${safe}%`, `code.ilike.%${safe}%`];
        if (digits.length >= 3) ors.push(`cpf.ilike.%${digits}%`, `cpf.ilike.%${safe}%`);
        query = query.or(ors.join(","));
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-primary">Pacientes</h1>
        <Button asChild><Link to="/pacientes/novo"><UserPlus /> Novo paciente</Link></Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome, CPF ou código (ex.: KE-000001)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        {isLoading ? (
          <p className="p-6 text-muted-foreground">Carregando...</p>
        ) : !data?.length ? (
          <p className="p-6 text-muted-foreground">{term ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado ainda."}</p>
        ) : (
          <ul className="divide-y">
            {data.map((p) => (
              <li key={p.id}>
                <Link to="/pacientes/$id" params={{ id: p.id }} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-muted">
                  <span className="w-24 font-mono text-xs text-muted-foreground">{p.code}</span>
                  <span className="min-w-0 flex-1 font-medium">
                    {p.social_name || p.full_name}
                    {p.social_name && <span className="ml-2 text-xs text-muted-foreground">({p.full_name})</span>}
                  </span>
                  <span className="text-sm text-muted-foreground">{calcAge(p.birth_date) != null ? `${calcAge(p.birth_date)} anos` : ""}</span>
                  <Badge variant="secondary">{p.category === "adolescente" ? "Adolescente" : "Adulto"}</Badge>
                  <Badge variant="outline">{PATIENT_STATUS[p.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
