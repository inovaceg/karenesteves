import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import karen from "@/assets/karen-esteves.jpg.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Karen Esteves" },
      { name: "description", content: "Acesso seguro à plataforma clínica Karen Esteves." },
      { property: "og:title", content: "Entrar — Karen Esteves" },
      { property: "og:description", content: "Acesso seguro à plataforma clínica." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("E-mail inválido").max(255);
const passSchema = z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(72);

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setInfo(null);
    const em = emailSchema.safeParse(email);
    if (!em.success) { toast.error(em.error.issues[0]?.message); return; }
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(em.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.");
        return;
      }
      const pw = passSchema.safeParse(password);
      if (!pw.success) { toast.error(pw.error.issues[0]?.message); return; }
      if (mode === "signup") {
        const n = z.string().trim().min(2, "Informe seu nome").max(120).safeParse(name);
        if (!n.success) { toast.error(n.error.issues[0]?.message); return; }
        const { error } = await supabase.auth.signUp({
          email: em.data,
          password: pw.data,
          options: { emailRedirectTo: window.location.origin + "/painel", data: { full_name: n.data } },
        });
        if (error) throw error;
        setInfo("Cadastro recebido! Confirme seu e-mail. O acesso será liberado pelo administrador.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: em.data, password: pw.data });
      if (error) throw new Error("E-mail ou senha incorretos.");
      navigate({ to: "/painel" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<Mode, string> = {
    login: "Bem-vinda(o) de volta",
    signup: "Solicitar acesso",
    forgot: "Recuperar senha",
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col items-center justify-center gap-6 bg-hero p-12 text-primary-foreground md:flex">
        <img src={karen.url} alt="Karen Esteves" className="h-48 w-48 rounded-full border-4 border-primary-foreground/80 object-cover shadow-soft" />
        <h1 className="text-4xl font-semibold">Karen Esteves</h1>
        <p className="font-serif text-lg italic text-primary-foreground/85">Cuidado, acolhimento e transformação.</p>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <img src={karen.url} alt="" className="h-14 w-14 rounded-full object-cover" />
            <div>
              <p className="font-serif text-xl font-semibold text-primary">Karen Esteves</p>
              <p className="text-xs text-muted-foreground">Cuidado, acolhimento e transformação.</p>
            </div>
          </div>
          <h2 className="text-3xl font-semibold text-foreground">{titles[mode]}</h2>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            {info && <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">{info}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Solicitar acesso" : "Enviar link"}
            </Button>
          </form>
          <div className="mt-6 flex flex-col gap-2 text-sm">
            {mode === "login" ? (
              <>
                <button className="text-left text-primary hover:underline" onClick={() => setMode("forgot")}>Esqueci minha senha</button>
                <button className="text-left text-muted-foreground hover:underline" onClick={() => setMode("signup")}>Sou profissional e quero solicitar acesso</button>
              </>
            ) : (
              <button className="text-left text-primary hover:underline" onClick={() => setMode("login")}>Voltar para o login</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
