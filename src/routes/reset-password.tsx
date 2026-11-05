import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Karen Esteves" },
      { name: "description", content: "Defina uma nova senha de acesso." },
      { property: "og:title", content: "Nova senha — Karen Esteves" },
      { property: "og:description", content: "Defina uma nova senha de acesso." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("A senha deve ter ao menos 8 caracteres");
    if (pw !== pw2) return toast.error("As senhas não conferem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error("Link inválido ou expirado. Solicite novamente.");
    toast.success("Senha atualizada");
    navigate({ to: "/painel" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-8 shadow-soft">
        <h1 className="text-2xl font-semibold text-primary">Criar nova senha</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Nova senha</Label>
          <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw2">Confirmar senha</Label>
          <Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>Salvar nova senha</Button>
      </form>
    </div>
  );
}
