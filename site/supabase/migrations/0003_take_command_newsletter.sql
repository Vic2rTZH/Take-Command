-- Newsletter issues and per-subscriber unsubscribe tokens.
alter table public.tc_subscribers add column if not exists unsub_token uuid not null default gen_random_uuid();
create unique index if not exists tc_subscribers_unsub_token_idx on public.tc_subscribers (unsub_token);

create table if not exists public.tc_newsletters (
  id uuid primary key default gen_random_uuid(),
  issue_no int,
  subject text not null default '',
  bluf text not null default '',
  ideas jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  action text not null default '',
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent')),
  recipients int,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tc_newsletters enable row level security;
