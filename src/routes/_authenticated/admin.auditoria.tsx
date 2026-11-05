import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria — Karen Esteves" }, { name: "description", content: "Registro de alterações." }] }),
  component: Auditoria,
});

const ACTIONS: Record<string, string> = { INSERT: "Criou", UPDATE: "Alterou", DELETE: "Removeu" };
const TABLES: Record<string, string> = {
  patients: "Paciente", guardians: "Responsável", profiles: "Usuário", user_roles: "Função de usuário",
  clinic_settings: "Configurações", patient_professionals: "Vínculo profissional",
};

function Auditoria() {
  const { data } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const [{ data: logs }, { data: profiles }] = await Promise.all([
        supabase.from("audit_logs").select("id, actor_id, action, table_name, record_id, created_at").order("created_at", { ascending: false }).limit(300),
        supabase.from("profiles").select("id, full_name, email"),
      ]);
      const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.email]));
      return (logs ?? []).map((l) => ({ ...l, actor: l.actor_id ? names.get(l.actor_id) ?? "—" : "Sistema" }));
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-3xl font-semibold text-primary">Registro de auditoria</h1>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground">
            <tr><th className="p-3">Data</th><th className="p-3">Quem</th><th className="p-3">Ação</th><th className="p-3">Registro</th></tr>
          </thead>
          <tbody className="divide-y">
            {data?.map((l) => (
              <tr key={l.id}>
                <td className="p-3 whitespace-nowrap">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                <td className="p-3">{l.actor}</td>
                <td className="p-3">{ACTIONS[l.action] ?? l.action}</td>
                <td className="p-3">{TABLES[l.table_name] ?? l.table_name}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={4} className="p-6 text-muted-foreground">Nenhum registro.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
