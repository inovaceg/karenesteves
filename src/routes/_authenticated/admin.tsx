import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useCurrentUser } from "@/lib/use-current-user";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { data: me } = useCurrentUser();
  if (!me?.isAdmin) return <p className="text-muted-foreground">Área restrita ao administrador.</p>;
  return <Outlet />;
}
