import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcAge } from "@/lib/roles";

export type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
export type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];

const opt = (max = 200) => z.string().trim().max(max).optional().or(z.literal("")).transform((v) => v || null);

export const patientSchema = z.object({
  full_name: z.string().trim().min(2, "Informe o nome completo").max(200),
  social_name: opt(),
  birth_date: opt(10),
  cpf: z.string().trim().regex(/^(\d{3}\.?\d{3}\.?\d{3}-?\d{2})?$/, "CPF inválido").optional().transform((v) => v || null),
  sex: opt(40),
  phone: opt(30),
  whatsapp: opt(30),
  email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")).transform((v) => v || null),
  address: opt(300),
  city: opt(100),
  state: opt(2),
  profession: opt(),
  education: opt(),
  marital_status: opt(60),
  category: z.enum(["adulto", "adolescente"]),
  status: z.enum(["ativo", "em_acompanhamento", "inativo", "alta", "aguardando"]),
  entry_date: z.string().min(10, "Informe a data de entrada"),
  responsible_professional_id: opt(40),
  referral_source: opt(),
});

export const PATIENT_STATUS: Record<string, string> = {
  aguardando: "Aguardando acolhimento",
  ativo: "Ativo",
  em_acompanhamento: "Em acompanhamento",
  inativo: "Inativo",
  alta: "Alta",
};

const sel = "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export function PatientForm({ initial, onSaved }: { initial?: PatientRow; onSaved: (id: string) => void }) {
  const [v, setV] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = { category: "adulto", status: "ativo", entry_date: new Date().toISOString().slice(0, 10) };
    if (initial) for (const [k, val] of Object.entries(initial)) base[k] = val == null ? "" : String(val);
    return base;
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((p) => ({ ...p, [k]: e.target.value }));

  const { data: pros } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email").eq("status", "ativo").order("full_name");
      return data ?? [];
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = patientSchema.safeParse(v);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    setSaving(true);
    const q = initial
      ? supabase.from("patients").update(parsed.data).eq("id", initial.id).select("id").single()
      : supabase.from("patients").insert(parsed.data).select("id").single();
    const { data, error } = await q;
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar: " + error.message); return; }
    toast.success("Paciente salvo");
    onSaved(data.id);
  }

  const F = ({ k, label, type = "text", className = "" }: { k: string; label: string; type?: string; className?: string }) => (
    <div className={"space-y-1.5 " + className}>
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} value={v[k] ?? ""} onChange={set(k)} />
    </div>
  );
  const age = calcAge(v["birth_date"]);

  return (
    <form onSubmit={submit} className="space-y-8">
      <Section title="Identificação">
        {F({ k: "full_name", label: "Nome completo *", className: "sm:col-span-2" })}
        {F({ k: "social_name", label: "Nome social" })}
        <div className="space-y-1.5">
          <Label htmlFor="birth_date">Data de nascimento {age != null && <span className="text-muted-foreground">· {age} anos</span>}</Label>
          <Input id="birth_date" type="date" value={v["birth_date"] ?? ""} onChange={set("birth_date")} />
        </div>
        {F({ k: "cpf", label: "CPF" })}
        {F({ k: "sex", label: "Sexo (quando pertinente)" })}
        {F({ k: "phone", label: "Telefone" })}
        {F({ k: "whatsapp", label: "WhatsApp" })}
        {F({ k: "email", label: "E-mail", type: "email" })}
        {F({ k: "address", label: "Endereço", className: "sm:col-span-2" })}
        {F({ k: "city", label: "Cidade" })}
        {F({ k: "state", label: "Estado (UF)" })}
        {F({ k: "profession", label: "Profissão" })}
        {F({ k: "education", label: "Escolaridade" })}
        {F({ k: "marital_status", label: "Estado civil" })}
      </Section>
      <Section title="Classificação">
        <div className="space-y-1.5">
          <Label>Faixa</Label>
          <select className={sel} value={v["category"]} onChange={set("category")}>
            <option value="adulto">Adulto</option>
            <option value="adolescente">Adolescente</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Situação do cadastro</Label>
          <select className={sel} value={v["status"]} onChange={set("status")}>
            {Object.entries(PATIENT_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        {F({ k: "entry_date", label: "Data de entrada *", type: "date" })}
        <div className="space-y-1.5">
          <Label>Profissional responsável</Label>
          <select className={sel} value={v["responsible_professional_id"] ?? ""} onChange={set("responsible_professional_id")}>
            <option value="">—</option>
            {pros?.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
          </select>
        </div>
        {F({ k: "referral_source", label: "Origem do encaminhamento", className: "sm:col-span-2" })}
      </Section>
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>{saving ? "Salvando..." : "Salvar paciente"}</Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-soft">
      <h2 className="mb-4 text-xl font-semibold text-primary">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}
