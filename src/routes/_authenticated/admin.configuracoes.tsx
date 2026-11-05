import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Karen Esteves" }, { name: "description", content: "Dados da clínica." }] }),
  component: Config,
});

const FIELDS = [
  ["clinic_name", "Nome oficial da clínica"], ["slogan", "Slogan"], ["responsible_name", "Responsável"],
  ["phone", "Telefone"], ["email", "E-mail"], ["address", "Endereço"], ["city", "Cidade"], ["state", "Estado (UF)"],
  ["logo_url", "Endereço da logomarca (link da imagem)"],
] as const;

function Config() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async () => (await supabase.from("clinic_settings").select("*").eq("id", 1).single()).data,
  });
  const [v, setV] = useState<Record<string, string>>({});
  useEffect(() => {
    if (data) setV(Object.fromEntries(Object.entries(data).map(([k, x]) => [k, x == null ? "" : String(x)])));
  }, [data]);

  async function save() {
    if (!v.clinic_name?.trim()) return toast.error("Informe o nome da clínica");
    const payload: Record<string, string | null> = {};
    for (const [k] of FIELDS) payload[k] = v[k]?.trim().slice(0, 500) || null;
    payload.professional_info = v.professional_info?.trim().slice(0, 2000) || null;
    payload.clinic_name = v.clinic_name.trim();
    const { error } = await supabase.from("clinic_settings").update({ ...payload, clinic_name: v.clinic_name.trim(), updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
    qc.invalidateQueries({ queryKey: ["clinic-settings"] });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-semibold text-primary">Configurações da clínica</h1>
      <div className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft sm:grid-cols-2">
        {FIELDS.map(([k, l]) => (
          <div key={k} className="space-y-1.5">
            <Label>{l}</Label>
            <Input value={v[k] ?? ""} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
          </div>
        ))}
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Informações profissionais verificadas (formação, registro)</Label>
          <Textarea rows={4} value={v.professional_info ?? ""} onChange={(e) => setV({ ...v, professional_info: e.target.value })} placeholder="Preencha apenas com informações verificadas." />
        </div>
        <div className="sm:col-span-2 flex justify-end"><Button onClick={save}>Salvar</Button></div>
      </div>
    </div>
  );
}
