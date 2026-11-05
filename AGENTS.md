<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Access control: roles live in `public.user_roles`; system access requires `profiles.status = 'ativo'` plus at least one role (helpers `is_active_staff`/`is_admin`). Why: new signups must never self-grant access.
- First signup becomes admin via `handle_new_user` trigger; all later signups start `pendente`. Why: bootstraps the clinic owner without a seed.
- Sensitive tables get the generic `audit_trigger`. Why: LGPD traceability of who changed what.
