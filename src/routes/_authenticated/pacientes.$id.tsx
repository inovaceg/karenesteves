import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PatientForm } from "@/components/patient-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/pacientes/$id")({
  head: () => ({ meta: [{ title: "Paciente — Karen Esteves" }, { name: "description", content: "Ficha do paciente." }] }),
  component: PacienteDetalhe,
});

function PacienteDetalhe() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;
  if (!patient) return <p>Paciente não encontrado.</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/pacientes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Pacientes</Link>
      <div>
        <p className="font-mono text-sm text-muted-foreground">{patient.code}</p>
        <h1 className="text-3xl font-semibold text-primary">{patient.social_name || patient.full_name}</h1>
      </div>
      <PatientForm
        key={patient.updated_at}
        initial={patient}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["patient", id] });
          qc.invalidateQueries({ queryKey: ["patients"] });
        }}
      />
      <Guardians patientId={id} />
    </div>
  );
}

function Guardians({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const empty = { full_name: "", relationship: "", phone: "", email: "", documents: "", legal_authorizations: "" };
  const [g, setG] = useState(empty);
  const { data } = useQuery({
    queryKey: ["guardians", patientId],
    queryFn: async () => (await supabase.from("guardians").select("*").eq("patient_id", patientId).order("created_at")).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => {
      if (g.full_name.trim().length < 2) throw new Error("Informe o nome do responsável");
      const { error } = await supabase.from("guardians").insert({ ...g, full_name: g.full_name.trim(), patient_id: patientId });
      if (error) throw error;
    },
    onSuccess: () => { setG(empty); toast.success("Responsável adicionado"); qc.invalidateQueries({ queryKey: ["guardians", patientId] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (gid: string) => { const { error } = await supabase.from("guardians").delete().eq("id", gid); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guardians", patientId] }),
  });
  const fields: [keyof typeof empty, string][] = [
    ["full_name", "Nome do responsável legal"], ["relationship", "Grau de parentesco"], ["phone", "Telefone"],
    ["email", "E-mail"], ["documents", "Documentação pertinente"], ["legal_authorizations", "Autorizações legais"],
  ];

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-soft">
      <h2 className="mb-4 text-xl font-semibold text-primary">Responsáveis</h2>
      {data?.length ? (
        <ul className="mb-6 divide-y rounded-xl border">
          {data.map((r) => (
            <li key={r.id} className="flex items-start gap-3 p-4 text-sm">
              <div className="flex-1">
                <p className="font-medium">{r.full_name} {r.relationship && <span className="text-muted-foreground">· {r.relationship}</span>}</p>
                <p className="text-muted-foreground">{[r.phone, r.email].filter(Boolean).join(" · ")}</p>
                {r.legal_authorizations && <p className="mt-1 text-muted-foreground">Autorizações: {r.legal_authorizations}</p>}
              </div>
              <Button size="icon" variant="ghost" aria-label="Remover responsável" onClick={() => del.mutate(r.id)}><Trash2 /></Button>
            </li>
          ))}
        </ul>
      ) : <p className="mb-4 text-sm text-muted-foreground">Nenhum responsável cadastrado.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(([k, l]) => (
          <div key={k} className="space-y-1.5">
            <Label>{l}</Label>
            <Input value={g[k]} onChange={(e) => setG({ ...g, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end"><Button variant="outline" onClick={() => add.mutate()} disabled={add.isPending}>Adicionar responsável</Button></div>
    </section>
  );
}
