create type public.app_role as enum ('admin','terapeuta','psicologo','medico','assistente_social','enfermagem','outro','recepcao');
create type public.user_status as enum ('pendente','ativo','suspenso');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  professional_registry text,
  status public.user_status not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_active_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = _user_id and p.status = 'ativo')
     and exists (select 1 from public.user_roles r where r.user_id = _user_id)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id,'admin') and exists (select 1 from public.profiles p where p.id=_user_id and p.status='ativo')
$$;

-- profiles policies
create policy "staff read profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_active_staff(auth.uid()));
create policy "own update profile" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()))
  with check (id = auth.uid() or public.is_admin(auth.uid()));

-- prevent non-admin from changing status
create or replace function public.protect_profile_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and not public.is_admin(auth.uid()) and auth.uid() is not null then
    raise exception 'Somente o administrador pode alterar o status do usuário';
  end if;
  if new.id = auth.uid() and new.status <> 'ativo' and public.has_role(new.id,'admin') then
    raise exception 'O administrador não pode suspender a própria conta';
  end if;
  new.updated_at = now();
  return new;
end $$;
create trigger trg_protect_profile_status before update on public.profiles
  for each row execute function public.protect_profile_status();

-- user_roles policies
create policy "read own or admin roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_active_staff(auth.uid()));
create policy "admin insert roles" on public.user_roles for insert to authenticated
  with check (public.is_admin(auth.uid()));
create policy "admin delete roles" on public.user_roles for delete to authenticated
  using (public.is_admin(auth.uid()) and not (user_id = auth.uid() and role = 'admin'));

-- new user: profile; first user becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare first_user boolean;
begin
  select not exists (select 1 from public.user_roles where role='admin') into first_user;
  insert into public.profiles (id, full_name, email, status)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email,
          case when first_user then 'ativo'::public.user_status else 'pendente'::public.user_status end);
  if first_user then
    insert into public.user_roles (user_id, role) values (new.id, 'admin'), (new.id, 'terapeuta');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- clinic settings
create table public.clinic_settings (
  id int primary key default 1 check (id = 1),
  clinic_name text not null default 'Karen Esteves',
  slogan text default 'Cuidado, acolhimento e transformação.',
  logo_url text,
  address text, city text, state text,
  phone text, email text,
  responsible_name text default 'Karen Esteves',
  professional_info text,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
grant select, insert, update on public.clinic_settings to authenticated;
grant all on public.clinic_settings to service_role;
alter table public.clinic_settings enable row level security;
create policy "staff read settings" on public.clinic_settings for select to authenticated using (public.is_active_staff(auth.uid()));
create policy "admin insert settings" on public.clinic_settings for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "admin update settings" on public.clinic_settings for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
insert into public.clinic_settings (id) values (1);

-- audit
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "admin read audit" on public.audit_logs for select to authenticated using (public.is_admin(auth.uid()));

create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), tg_op, tg_table_name,
    coalesce((case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id', null),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

-- patients
create sequence public.patient_code_seq;
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('KE-' || lpad(nextval('public.patient_code_seq')::text, 6, '0')),
  full_name text not null,
  social_name text,
  birth_date date,
  cpf text,
  sex text,
  phone text, whatsapp text, email text,
  address text, city text, state text,
  profession text, education text, marital_status text,
  category text not null default 'adulto' check (category in ('adulto','adolescente')),
  status text not null default 'ativo' check (status in ('ativo','em_acompanhamento','inativo','alta','aguardando')),
  entry_date date not null default current_date,
  responsible_professional_id uuid references public.profiles(id),
  referral_source text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.patients (full_name);
create index on public.patients (cpf);
grant select, insert, update, delete on public.patients to authenticated;
grant all on public.patients to service_role;
alter table public.patients enable row level security;
create policy "staff read patients" on public.patients for select to authenticated using (public.is_active_staff(auth.uid()));
create policy "staff insert patients" on public.patients for insert to authenticated with check (public.is_active_staff(auth.uid()));
create policy "staff update patients" on public.patients for update to authenticated using (public.is_active_staff(auth.uid())) with check (public.is_active_staff(auth.uid()));
create policy "admin delete patients" on public.patients for delete to authenticated using (public.is_admin(auth.uid()));

create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  full_name text not null,
  relationship text,
  phone text, email text,
  documents text,
  legal_authorizations text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.guardians to authenticated;
grant all on public.guardians to service_role;
alter table public.guardians enable row level security;
create policy "staff all guardians" on public.guardians for all to authenticated using (public.is_active_staff(auth.uid())) with check (public.is_active_staff(auth.uid()));

create table public.patient_professionals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (patient_id, professional_id)
);
grant select, insert, delete on public.patient_professionals to authenticated;
grant all on public.patient_professionals to service_role;
alter table public.patient_professionals enable row level security;
create policy "staff read links" on public.patient_professionals for select to authenticated using (public.is_active_staff(auth.uid()));
create policy "admin or therapist manage links" on public.patient_professionals for insert to authenticated with check (public.is_admin(auth.uid()) or (public.is_active_staff(auth.uid()) and public.has_role(auth.uid(),'terapeuta')));
create policy "admin or therapist delete links" on public.patient_professionals for delete to authenticated using (public.is_admin(auth.uid()) or (public.is_active_staff(auth.uid()) and public.has_role(auth.uid(),'terapeuta')));

create trigger audit_profiles after update on public.profiles for each row execute function public.audit_trigger();
create trigger audit_roles after insert or delete on public.user_roles for each row execute function public.audit_trigger();
create trigger audit_settings after update on public.clinic_settings for each row execute function public.audit_trigger();
create trigger audit_patients after insert or update or delete on public.patients for each row execute function public.audit_trigger();
create trigger audit_guardians after insert or update or delete on public.guardians for each row execute function public.audit_trigger();
create trigger audit_links after insert or delete on public.patient_professionals for each row execute function public.audit_trigger();