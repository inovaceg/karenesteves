import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Users, UserCog, Settings, ScrollText, LogOut, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/use-current-user";
import { canAccessSystem, ROLE_LABELS, STATUS_LABELS } from "@/lib/roles";
import karen from "@/assets/karen-esteves.jpg.asset.json";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: AuthedLayout,
});

function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

function AuthedLayout() {
  const { data: me, isLoading } = useCurrentUser();
  const signOut = useSignOut();

  if (isLoading || !me) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  if (!canAccessSystem(me.profile?.status, me.roles)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
        <div className="max-w-md rounded-2xl bg-card p-8 text-center shadow-soft">
          <Clock className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold text-primary">
            {me.profile?.status === "suspenso" ? "Acesso suspenso" : "Aguardando liberação"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {me.profile?.status === "suspenso"
              ? "Seu acesso foi suspenso pela administração. Entre em contato com a clínica."
              : "Seu cadastro foi recebido. O administrador precisa definir sua função antes do primeiro acesso."}
          </p>
          <Button variant="outline" className="mt-6" onClick={signOut}>Sair</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar isAdmin={me.isAdmin} name={me.profile?.full_name || me.user.email || ""} role={me.roles[0] ? ROLE_LABELS[me.roles[0]] : ""} onSignOut={signOut} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur">
            <SidebarTrigger />
            <span className="font-serif text-lg text-primary">Karen Esteves</span>
            <span className="ml-auto hidden text-xs text-muted-foreground sm:block">{STATUS_LABELS[me.profile!.status]} · {me.roles.map((r) => ROLE_LABELS[r]).join(", ")}</span>
          </header>
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({ isAdmin, name, role, onSignOut }: { isAdmin: boolean; name: string; role: string; onSignOut: () => void }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (s) => s.location.pathname });
  const main = [
    { title: "Painel", url: "/painel", icon: LayoutDashboard },
    { title: "Pacientes", url: "/pacientes", icon: Users },
  ] as const;
  const admin = [
    { title: "Usuários", url: "/admin/usuarios", icon: UserCog },
    { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
    { title: "Auditoria", url: "/admin/auditoria", icon: ScrollText },
  ] as const;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 p-2">
          <img src={karen.url} alt="Karen Esteves" className="h-10 w-10 shrink-0 rounded-full border-2 border-sidebar-primary/70 object-cover" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-serif text-base font-semibold">Karen Esteves</p>
              <p className="truncate text-[11px] opacity-75">Cuidado, acolhimento e transformação</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Atendimento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild isActive={path.startsWith(i.url)} tooltip={i.title}>
                    <Link to={i.url}><i.icon /><span>{i.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {admin.map((i) => (
                  <SidebarMenuItem key={i.url}>
                    <SidebarMenuButton asChild isActive={path.startsWith(i.url)} tooltip={i.title}>
                      <Link to={i.url}><i.icon /><span>{i.title}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && (
          <div className="px-2 text-xs">
            <p className="truncate font-semibold">{name}</p>
            <p className="truncate opacity-75">{role}</p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSignOut} tooltip="Sair">
              <LogOut /><span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
