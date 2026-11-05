import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ALL_ROLES, ROLE_LABELS, STATUS_LABELS, type AppRole, type UserStatus } from "@/lib/roles";
import { useCurrentUser } from "@/lib/use-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Karen Esteves" }, { name: "description", content: "Gestão de usuários e permissões." }] }),
  component: Usuarios,
});

function Usuarios() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return (profiles ?? []).map((p) => ({ ...p, roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole) }));
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, on }: { userId: string; role: AppRole; on: boolean }) => {
      const { error } = on
        ? await supabase.from("user_roles").insert({ user_id: userId, role })
        : await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });
  const setStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: UserStatus }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => { refresh(); toast.success("Status atualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeAccess = useMutation({
    mutationFn: async (userId: string) => {
      const { error: e1 } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("profiles").update({ status: "suspenso" }).eq("id", userId);
      if (e2) throw e2;
    },
    onSuccess: () => { refresh(); toast.success("Acesso removido. Os registros de autoria foram preservados."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary">Usuários e permissões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Novos profissionais solicitam acesso pela tela de login. Defina a função e ative o acesso aqui.
        </p>
      </div>
      <div className="space-y-4">
        {data?.map((u) => {
          const self = u.id === me?.user.id;
          return (
            <div key={u.id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{u.full_name || "(sem nome)"} {self && <span className="text-xs text-muted-foreground">(você)</span>}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <Badge variant={u.status === "ativo" ? "default" : u.status === "suspenso" ? "destructive" : "secondary"}>{STATUS_LABELS[u.status]}</Badge>
                {!self && (
                  <div className="flex flex-wrap gap-2">
                    {u.status !== "ativo" && <Button size="sm" onClick={() => setStatus.mutate({ userId: u.id, status: "ativo" })}>Ativar</Button>}
                    {u.status === "ativo" && <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ userId: u.id, status: "suspenso" })}>Suspender</Button>}
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover todas as funções e suspender este acesso?")) removeAccess.mutate(u.id); }}>Remover acesso</Button>
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {ALL_ROLES.map((r) => {
                  const checked = u.roles.includes(r);
                  const locked = self && r === "admin";
                  return (
                    <label key={r} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={checked} disabled={locked || toggleRole.isPending} onCheckedChange={(on) => toggleRole.mutate({ userId: u.id, role: r, on: !!on })} />
                      {ROLE_LABELS[r]}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
