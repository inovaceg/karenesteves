create table public.anamneses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  kind text not null default 'adulto' check (kind in ('adulto','adolescente')),
  mode text not null default 'entrevista' check (mode in ('entrevista','paciente')),
  status text not null default 'rascunho' check (status in ('rascunho','finalizada')),
  answers jsonb not null default '{}'::jsonb,
  current_step int not null default 0,
  risk_flag boolean not null default false,
  created_by uuid default auth.uid(),
  finalized_by uuid,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.anamneses (patient_id);
grant select, insert, update on public.anamneses to authenticated;
grant all on public.anamneses to service_role;
alter table public.anamneses enable row level security;

create or replace function public.is_clinical_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id=_user_id and p.status='ativo')
   and exists (select 1 from public.user_roles r where r.user_id=_user_id
     and r.role in ('admin','terapeuta','psicologo','medico','assistente_social','enfermagem','outro'))
$$;

create policy "clinical read anamneses" on public.anamneses for select to authenticated using (public.is_clinical_staff(auth.uid()));
create policy "clinical insert anamneses" on public.anamneses for insert to authenticated with check (public.is_clinical_staff(auth.uid()));
create policy "clinical update draft anamneses" on public.anamneses for update to authenticated using (public.is_clinical_staff(auth.uid()) and status = 'rascunho') with check (public.is_clinical_staff(auth.uid()));

create or replace function public.anamnesis_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'finalizada' then
    raise exception 'Anamnese finalizada não pode ser alterada';
  end if;
  if new.status = 'finalizada' and old.status <> 'finalizada' then
    new.finalized_by = auth.uid();
    new.finalized_at = now();
  end if;
  new.updated_at = now();
  return new;
end $$;
create trigger trg_anamnesis_guard before update on public.anamneses for each row execute function public.anamnesis_guard();
create trigger audit_anamneses after insert or update on public.anamneses for each row execute function public.audit_trigger();

create table public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  anamnesis_id uuid not null references public.anamneses(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  content text not null,
  status text not null default 'pendente' check (status in ('pendente','aprovado','descartado')),
  created_by uuid default auth.uid(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.ai_reports to authenticated;
grant all on public.ai_reports to service_role;
alter table public.ai_reports enable row level security;
create policy "clinical read ai" on public.ai_reports for select to authenticated using (public.is_clinical_staff(auth.uid()));
create policy "clinical insert ai" on public.ai_reports for insert to authenticated with check (public.is_clinical_staff(auth.uid()));
create policy "clinical review ai" on public.ai_reports for update to authenticated using (public.is_clinical_staff(auth.uid()) and status = 'pendente') with check (public.is_clinical_staff(auth.uid()));
create trigger audit_ai after insert or update on public.ai_reports for each row execute function public.audit_trigger();