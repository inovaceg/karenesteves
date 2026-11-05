export type Field =
  | { id: string; label: string; type: "text" | "textarea" | "date" }
  | { id: string; label: string; type: "choice"; options: string[] }
  | { id: string; label: string; type: "risk" }
  | { id: string; label: string; type: "substances" };

export type Step = { id: string; title: string; intro?: string; professionalOnly?: boolean; fields: Field[] };

export const SUBSTANCES = [
  "Álcool", "Tabaco", "Maconha", "Cocaína", "Crack", "Medicamentos sem orientação médica",
  "Benzodiazepínicos", "Estimulantes", "Opioides", "Alucinógenos", "Outras substâncias", "Uso combinado",
];

export const SUBSTANCE_FIELDS: [string, string][] = [
  ["first_age", "Idade do primeiro uso"], ["last_use", "Data do último uso"], ["frequency", "Frequência"],
  ["amount", "Quantidade aproximada"], ["route", "Forma de utilização"], ["duration", "Duração do consumo"],
  ["contexts", "Contextos associados"], ["consequences", "Consequências percebidas"],
  ["stop_attempts", "Tentativas de interrupção"], ["abstinence", "Histórico de abstinência"],
  ["relapses", "Recaídas"], ["prev_treatment", "Tratamentos anteriores"],
];

export const RISK_OPTIONS = ["Não", "Passado (histórico)", "Recente", "Atual"] as const;

const t = (id: string, label: string): Field => ({ id, label, type: "textarea" });
const yn = (id: string, label: string): Field => ({ id, label, type: "choice", options: ["Sim", "Não", "Prefere não informar"] });
const r = (id: string, label: string): Field => ({ id, label, type: "risk" });

const shared = {
  substances: { id: "C", title: "Histórico de substâncias", intro: "Selecione todas as substâncias e preencha os detalhes de cada uma.", fields: [{ id: "substances", label: "Substâncias", type: "substances" } as Field] },
  safety: {
    id: "I", title: "Avaliação de segurança",
    intro: "Para cada item, indique se a situação é atual, recente ou apenas histórica. Situações atuais geram alerta imediato para avaliação profissional.",
    fields: [
      r("risk_suicidal_ideation", "Ideação suicida"), r("risk_suicide_attempt", "Tentativa de suicídio"),
      r("risk_self_harm", "Automutilação"), r("risk_violence", "Risco de violência"),
      r("risk_abuse", "Situações de abuso"), r("risk_intoxication", "Intoxicação atual"),
      r("risk_withdrawal", "Possíveis complicações de abstinência"), r("risk_social", "Vulnerabilidade social"),
      r("risk_family_env", "Riscos no ambiente familiar"), t("risk_notes", "Detalhes sobre as situações sinalizadas"),
    ],
  } as Step,
  professional: {
    id: "K", title: "Impressão e avaliação profissional", professionalOnly: true,
    fields: [
      t("pro_observations", "Observações clínicas"), t("pro_synthesis", "Síntese da entrevista"),
      t("pro_needs", "Necessidades identificadas"), t("pro_risk_factors", "Fatores de risco"),
      t("pro_protective", "Fatores de proteção"), t("pro_hypotheses", "Hipóteses a investigar"),
      t("pro_referrals", "Encaminhamentos recomendados"), t("pro_conduct", "Condutas profissionais"),
      t("pro_plan", "Plano inicial de acompanhamento"),
    ],
  } as Step,
  closing: {
    id: "L", title: "Encerramento", professionalOnly: true,
    fields: [
      { id: "close_date", label: "Data da avaliação", type: "date" },
      { id: "close_professional", label: "Profissional responsável", type: "text" },
      { id: "close_registry", label: "Registro profissional (quando aplicável)", type: "text" },
      { id: "close_next", label: "Data da próxima avaliação", type: "date" },
    ],
  } as Step,
};

export const ADULT_STEPS: Step[] = [
  { id: "A", title: "Identificação e contexto familiar", fields: [
    t("a_lives_with", "Com quem mora?"), t("a_reference", "Quem são as pessoas de referência?"),
    t("a_family_rel", "Como é a relação familiar?"), t("a_children", "Possui filhos?"),
    yn("a_family_history", "Existe histórico familiar de dependência química?"), t("a_family_history_detail", "Se sim, descreva"),
    t("a_support", "Possui rede de apoio?"), t("a_routine", "Como é sua rotina?") ] },
  { id: "B", title: "Motivo da procura", fields: [
    t("b_motive", "O que motivou a procura pelo atendimento?"), t("b_suggested", "Quem sugeriu o tratamento?"),
    t("b_difficulties", "Quais dificuldades enfrenta atualmente?"), t("b_change", "O que gostaria de modificar?"),
    t("b_expectations", "Quais são suas expectativas?") ] },
  shared.substances,
  { id: "D", title: "Histórico de tratamento", fields: [
    yn("d_prev", "Já realizou tratamento anteriormente?"), t("d_where", "Onde e por quanto tempo?"),
    t("d_modality", "Modalidade (internação voluntária, ambulatorial, outra)"), t("d_results", "Quais resultados percebeu?"),
    t("d_meds", "Utiliza medicamentos prescritos?"), t("d_followup", "Faz acompanhamento médico ou psicológico?"),
    yn("d_detox", "Possui histórico de desintoxicação?") ] },
  { id: "E", title: "Saúde física", fields: [
    t("e_diseases", "Doenças diagnosticadas"), t("e_allergies", "Alergias"), t("e_meds", "Medicamentos utilizados"),
    t("e_hospital", "Histórico de internações"), t("e_sleep", "Problemas relacionados ao sono"), t("e_food", "Alimentação"),
    t("e_symptoms", "Dores ou sintomas atuais"), t("e_seizures", "Convulsões ou complicações relacionadas à abstinência") ] },
  { id: "F", title: "Saúde emocional e psicológica", fields: [
    t("f_anxiety", "Ansiedade"), t("f_depression", "Depressão"), t("f_mood", "Alterações de humor e irritabilidade"),
    t("f_concentration", "Dificuldade de concentração"), t("f_sleep", "Alterações do sono"), t("f_trauma", "Traumas"),
    t("f_psy_history", "Acompanhamento psicológico / histórico psiquiátrico"), t("f_feelings", "Sentimentos relacionados ao consumo") ] },
  { id: "G", title: "Avaliação psicossocial", fields: [
    t("g_family", "Relações familiares"), t("g_work", "Vida profissional"), t("g_finance", "Situação financeira"),
    t("g_school", "Escolaridade"), t("g_housing", "Moradia"), t("g_social", "Convivência social"),
    t("g_spirituality", "Espiritualidade (se pertinente e consentido)"), t("g_vulnerability", "Situações de vulnerabilidade"),
    t("g_protective", "Fatores de proteção") ] },
  { id: "H", title: "Histórico jurídico e social", fields: [
    t("h_legal", "Problemas judiciais relacionados ao consumo (quando informado)"), t("h_violence", "Situações de violência"),
    t("h_conflicts", "Conflitos familiares"), t("h_losses", "Perdas sociais"), t("h_work", "Dificuldades profissionais") ] },
  shared.safety,
  { id: "J", title: "Motivação e objetivos", fields: [
    { id: "j_goal", label: "Deseja interromper ou reduzir o consumo?", type: "choice", options: ["Interromper", "Reduzir", "Ainda não sei"] },
    t("j_reasons", "Quais motivos o levam a buscar mudança?"), t("j_difficulties", "Quais são suas maiores dificuldades?"),
    t("j_expect", "O que espera do acompanhamento?"), t("j_objectives", "Quais objetivos gostaria de alcançar?"),
    t("j_resources", "Quais recursos pessoais identifica?") ] },
  shared.professional,
  shared.closing,
];

export const TEEN_STEPS: Step[] = [
  { id: "A", title: "Quem é você", intro: "Aqui não existem respostas certas ou erradas. Conte do seu jeito.", fields: [
    t("ta_about", "Como você se descreveria?"), t("ta_likes", "O que você gosta de fazer?"),
    t("ta_development", "Desenvolvimento pessoal (observações)") ] },
  { id: "B", title: "Família e casa", fields: [
    t("tb_lives_with", "Com quem você mora?"), t("tb_family", "Como é a convivência em casa?"),
    t("tb_trust", "Em quem você confia na família?"), yn("tb_family_use", "Alguém da família usa álcool ou outras drogas?") ] },
  { id: "C2", title: "Escola", fields: [
    t("tc_school", "Você estuda? Em que ano/série?"), t("tc_performance", "Como está na escola (notas, faltas, mudanças)?"),
    t("tc_relations", "Como é a relação com colegas e professores?") ] },
  { id: "D2", title: "Amizades e contexto social", fields: [
    t("td_friends", "Como são suas amizades?"), t("td_free_time", "Onde e com quem passa o tempo livre?"),
    t("td_online", "Como é seu uso de internet e redes sociais?") ] },
  shared.substances,
  { id: "F", title: "Como você se sente", fields: [
    t("tf_mood", "Como tem se sentido ultimamente?"), t("tf_sleep", "Como está seu sono?"),
    t("tf_worries", "O que mais te preocupa?"), t("tf_help", "Já recebeu acompanhamento psicológico?") ] },
  { id: "G2", title: "Violência e vulnerabilidade", fields: [
    t("tg_violence", "Já passou por alguma situação de violência?"), t("tg_bullying", "Já sofreu bullying ou ameaças?"),
    t("tg_vulnerability", "Situações de vulnerabilidade identificadas") ] },
  shared.safety,
  { id: "P", title: "Rede de proteção e consentimentos", fields: [
    t("tp_network", "Rede de proteção (escola, conselho tutelar, serviços)"),
    t("tp_guardian", "Responsável legal presente / informado"),
    { id: "tp_assent", label: "Assentimento do adolescente", type: "choice", options: ["Concorda em participar", "Não concorda", "Pendente"] },
    { id: "tp_consent", label: "Consentimento do responsável", type: "choice", options: ["Obtido", "Pendente", "Não aplicável"] },
    t("tp_confidentiality", "Combinados de confidencialidade") ] },
  { id: "J", title: "O que você quer mudar", fields: [
    t("tj_change", "O que você gostaria que fosse diferente?"), t("tj_goals", "Quais são seus objetivos?"),
    t("tj_strengths", "No que você é bom(boa)?") ] },
  shared.professional,
  shared.closing,
];

export type Answers = Record<string, unknown>;

/** True when any safety item is marked as current or recent — needs immediate professional evaluation. */
export function hasImmediateRisk(answers: Answers): boolean {
  return shared.safety.fields.some((f) => {
    if (f.type !== "risk") return false;
    const v = answers[f.id];
    return v === "Atual" || v === "Recente";
  });
}

export function stepsFor(kind: string) {
  return kind === "adolescente" ? TEEN_STEPS : ADULT_STEPS;
}

/** Plain-text export of answers for review/AI, without patient identifiers. */
export function answersToText(kind: string, answers: Answers): string {
  const lines: string[] = [];
  for (const s of stepsFor(kind)) {
    lines.push(`## ${s.id}. ${s.title}`);
    for (const f of s.fields) {
      if (f.type === "substances") {
        const subs = (answers["substances"] as Record<string, Record<string, string>> | undefined) ?? {};
        const keys = Object.keys(subs);
        if (!keys.length) lines.push("- Substâncias: (não informado)");
        for (const k of keys) {
          lines.push(`### ${k}`);
          for (const [fid, fl] of SUBSTANCE_FIELDS) lines.push(`- ${fl}: ${subs[k]?.[fid] || "(não informado)"}`);
        }
      } else {
        const v = answers[f.id];
        lines.push(`- ${f.label}: ${v ? String(v) : "(não informado)"}`);
      }
    }
  }
  return lines.join("\n");
}
