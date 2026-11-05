# Plataforma Clínica Karen Esteves — Plano em etapas

Sistema real de gestão clínica (não apenas site), construído em etapas, com Lovable Cloud (banco de dados, login, arquivos privados) e proteção por perfil em cada tabela.

## Identidade visual
- Cores: verde escuro #176B55, verde médio #75A992, verde claro #E7F2EC, branco, cinza suave.
- Tipografia moderna e confortável (ex.: Manrope + Lora para títulos), cards arredondados, ícones finos, menu lateral recolhível.
- A foto enviada da Karen será usada na tela de login e no topo do menu lateral.
- Funciona em computador, tablet e celular.

## Etapa 1 — Base, login e administração de usuários
- Login com e-mail e senha, "esqueci minha senha", página de nova senha, sair com segurança.
- Perfis: Administrador, Terapeuta responsável, Psicólogo, Médico, Assistente social, Enfermagem, Outros profissionais, Recepção.
- Novos cadastros entram sem nenhuma função; somente o administrador atribui funções, ativa, suspende ou remove acessos (o histórico de autoria é preservado).
- O primeiro usuário cadastrado (a Karen) vira administrador automaticamente.
- Configurações da clínica (nome, logomarca, endereço, telefone, e-mail, responsável, registro profissional — preenchidos por vocês, nada inventado).
- Registro de auditoria (quem fez o quê e quando).

## Etapa 2 — Pacientes
- Cadastro completo (identificação, classificação adulto/adolescente, responsáveis legais), código único automático (ex.: KE-000123), idade calculada.
- Busca por nome, CPF ou código; vínculo paciente ↔ profissionais.
- Recepção vê apenas dados cadastrais; conteúdo clínico só para profissionais vinculados.

## Etapa 3 — Agenda e presença
- Calendário dia/semana/mês, bloqueio de conflito de horário do mesmo profissional.
- Lista de presença por data: presente, falta, falta justificada, cancelado, realizado; filtros; relatórios de frequência em PDF e Excel.

## Etapa 4 — Anamnese
- Anamnese adulta (módulos A a L) e anamnese adolescente com linguagem própria.
- Etapas com barra de progresso, salvamento automático, continuar depois.
- Por substância: idade do 1º uso, último uso, frequência, quantidade, etc.
- Avaliação de segurança com alerta imediato de risco (sem depender de IA), separando atual/passado.
- Dois modos: entrevista pelo profissional e link seguro para o paciente preencher no celular; cada resposta mostra quem respondeu.

## Etapa 5 — Prontuário e plano terapêutico
- Página do paciente com abas: cadastro, anamneses, evoluções, atendimentos, plano, metas, encaminhamentos, documentos, frequência, reavaliações.
- Evoluções com data, hora, autor e histórico de alterações; registros finalizados não podem ser apagados nem alterados em silêncio (apenas adendos).
- Documentos em armazenamento privado.

## Etapa 6 — Painel, relatórios e IA
- Painel com indicadores e gráficos (atendimentos por mês, presenças x faltas, novos cadastros, evolução), sem dados clínicos sensíveis.
- Gerador de PDF (ficha, anamnese, relatórios, plano, encaminhamento, frequência, termos) com cabeçalho da clínica, paginação e profissional responsável.
- Assistente de IA opcional: resumo, informações ausentes, contradições, perguntas sugeridas. Envia apenas dados minimizados, nunca diagnostica nem grava no prontuário sem aprovação do profissional.

## Detalhes técnicos
- Tabelas: profiles, user_roles (separada, função has_role), clinic_settings, professional_profiles, patients, guardians, patient_professionals, consents, anamneses, anamnesis_answers, appointments, attendance_records, clinical_evolution (+ revisões), treatment_plans, treatment_goals, clinical_documents, referrals, ai_reports, audit_logs.
- RLS em todas as tabelas: acesso clínico = função clínica + vínculo com o paciente (ou admin); recepção sem leitura de tabelas clínicas.
- Triggers de auditoria e de imutabilidade para registros finalizados.
- Convite do paciente por token de uso único com validade, acessando somente a própria anamnese.
- Nenhum dado fictício apresentado como paciente real.
- Ao fim de cada etapa: testes de permissões, persistência e telas em celular/computador.

Depois da aprovação, começo pela Etapa 1 e sigo etapa por etapa.
