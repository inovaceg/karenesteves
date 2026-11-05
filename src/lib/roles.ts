import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type UserStatus = Database["public"]["Enums"]["user_status"];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  terapeuta: "Terapeuta responsável",
  psicologo: "Psicólogo(a)",
  medico: "Médico(a)",
  assistente_social: "Assistente social",
  enfermagem: "Enfermagem",
  outro: "Outros profissionais",
  recepcao: "Recepção",
};

export const ALL_ROLES = Object.keys(ROLE_LABELS) as AppRole[];

export const CLINICAL_ROLES: AppRole[] = [
  "terapeuta",
  "psicologo",
  "medico",
  "assistente_social",
  "enfermagem",
  "outro",
];

export const STATUS_LABELS: Record<UserStatus, string> = {
  pendente: "Aguardando liberação",
  ativo: "Ativo",
  suspenso: "Suspenso",
};

/** A user may use the system only when active and holding at least one role. */
export function canAccessSystem(status: UserStatus | null | undefined, roles: AppRole[]) {
  return status === "ativo" && roles.length > 0;
}

export function isClinical(roles: AppRole[]) {
  return roles.some((r) => CLINICAL_ROLES.includes(r));
}

/** Age in full years at `today`, or null when no birth date. */
export function calcAge(birthDate: string | null | undefined, today = new Date()): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  let age = today.getFullYear() - y;
  const mm = today.getMonth() + 1;
  if (mm < m || (mm === m && today.getDate() < d)) age--;
  return age;
}
