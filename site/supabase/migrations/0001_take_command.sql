-- Take Command site: resources, subscribers, download requests and page views.
-- All access goes through the server (service role). Row level security is on with no public policies.

create table if not exists public.tc_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  kind text not null default 'Workbook',
  quote text,
  description text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  pages int check (pages is null or pages > 0),
  minutes int check (minutes is null or minutes > 0),
  cover_url text,
  file_path text,
  status text not null default 'draft' check (status in ('draft', 'coming_soon', 'published')),
  sort int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tc_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  name text,
  newsletter boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tc_requests (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.tc_resources (id) on delete cascade,
  subscriber_id uuid not null references public.tc_subscribers (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  downloaded_at timestamptz,
  download_count int not null default 0
);

create table if not exists public.tc_page_views (
  id bigint generated always as identity primary key,
  path text not null,
  resource_slug text,
  referrer_host text,
  visitor_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists tc_requests_created_idx on public.tc_requests (created_at);
create index if not exists tc_requests_resource_idx on public.tc_requests (resource_id);
create index if not exists tc_requests_subscriber_idx on public.tc_requests (subscriber_id);
create index if not exists tc_page_views_created_idx on public.tc_page_views (created_at);

alter table public.tc_resources enable row level security;
alter table public.tc_subscribers enable row level security;
alter table public.tc_requests enable row level security;
alter table public.tc_page_views enable row level security;

-- Records a download and returns the file path for the request's resource.
create or replace function public.tc_record_download(p_token uuid)
returns text
language sql
set search_path = public
as $$
  with hit as (
    update tc_requests
       set download_count = download_count + 1,
           downloaded_at = coalesce(downloaded_at, now())
     where token = p_token
    returning resource_id
  )
  select r.file_path from hit join tc_resources r on r.id = hit.resource_id;
$$;

-- Dashboard figures for the last p_days days, with the previous period for comparison.
create or replace function public.tc_overview(p_days int default 30, p_tz text default 'Africa/Lusaka')
returns jsonb
language sql
stable
set search_path = public
as $$
  with p as (
    select (now() at time zone p_tz)::date as today,
           (now() at time zone p_tz)::date - (p_days - 1) as start_day,
           (now() at time zone p_tz)::date - (2 * p_days - 1) as prev_day
  ),
  v as (
    select (pv.created_at at time zone p_tz)::date as day, pv.visitor_hash, pv.resource_slug, pv.referrer_host
      from tc_page_views pv, p
     where pv.created_at >= (p.prev_day::timestamp at time zone p_tz)
  ),
  r as (
    select (q.created_at at time zone p_tz)::date as day, q.resource_id
      from tc_requests q, p
     where q.created_at >= (p.prev_day::timestamp at time zone p_tz)
  ),
  d as (
    select (q.downloaded_at at time zone p_tz)::date as day, q.resource_id
      from tc_requests q, p
     where q.downloaded_at >= (p.prev_day::timestamp at time zone p_tz)
  ),
  days as (
    select g::date as day from p, generate_series(p.start_day::timestamp, p.today::timestamp, interval '1 day') g
  )
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'views', (select count(*) from v, p where v.day >= p.start_day),
      'visitors', (select count(distinct (v.day, v.visitor_hash)) from v, p where v.day >= p.start_day),
      'signups', (select count(*) from r, p where r.day >= p.start_day),
      'downloads', (select count(*) from d, p where d.day >= p.start_day)
    ),
    'previous', jsonb_build_object(
      'views', (select count(*) from v, p where v.day < p.start_day),
      'visitors', (select count(distinct (v.day, v.visitor_hash)) from v, p where v.day < p.start_day),
      'signups', (select count(*) from r, p where r.day < p.start_day),
      'downloads', (select count(*) from d, p where d.day < p.start_day and d.day >= p.prev_day)
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', days.day,
        'views', (select count(*) from v where v.day = days.day),
        'visitors', (select count(distinct v.visitor_hash) from v where v.day = days.day),
        'signups', (select count(*) from r where r.day = days.day),
        'downloads', (select count(*) from d where d.day = days.day)
      ) order by days.day), '[]'::jsonb)
      from days
    ),
    'by_resource', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.signups desc, x.views desc, x.title), '[]'::jsonb)
      from (
        select s.slug, s.title, s.status,
               (select count(*) from v, p where v.resource_slug = s.slug and v.day >= p.start_day) as views,
               (select count(*) from r, p where r.resource_id = s.id and r.day >= p.start_day) as signups,
               (select count(*) from d, p where d.resource_id = s.id and d.day >= p.start_day) as downloads
          from tc_resources s
      ) x
    ),
    'referrers', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.views desc, x.host), '[]'::jsonb)
      from (
        select coalesce(nullif(v.referrer_host, ''), 'Direct') as host, count(*) as views
          from v, p
         where v.day >= p.start_day
         group by 1
         order by 2 desc
         limit 8
      ) x
    ),
    'recent', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
      from (
        select s.email, s.name, s.newsletter, t.title as resource, q.created_at, q.downloaded_at
          from tc_requests q
          join tc_subscribers s on s.id = q.subscriber_id
          join tc_resources t on t.id = q.resource_id
         order by q.created_at desc
         limit 8
      ) x
    )
  );
$$;

revoke all on function public.tc_record_download(uuid) from public, anon, authenticated;
revoke all on function public.tc_overview(int, text) from public, anon, authenticated;
grant execute on function public.tc_record_download(uuid) to service_role;
grant execute on function public.tc_overview(int, text) to service_role;

-- Starting content. Edit or add more in the admin panel.
insert into public.tc_resources (slug, title, kind, quote, description, highlights, pages, minutes, cover_url, status, sort)
values
  ('life-audit', 'The Commander''s Life Audit', 'Workbook',
   'You cannot command what you are unwilling to examine.',
   'You may be advancing in one area of life while another quietly falls behind. This free workbook helps you assess seven domains, see what needs attention and decide your next action.',
   '[{"title":"Spiritual","text":"Meaning, values and purpose."},{"title":"Physical","text":"Health, fitness and wellbeing."},{"title":"Financial","text":"Money, resources and security."},{"title":"Relational","text":"Family, friendships and relationships."},{"title":"Creational","text":"Creativity, ideas and things you build."},{"title":"Professional","text":"Career, competence and contribution."},{"title":"Generational","text":"Legacy, mentorship and lasting impact."}]'::jsonb,
   8, 45, '/brand/life-audit-cover.png', 'published', 10),
  ('strategic-thinking-worksheet', 'Strategic Thinking Worksheet', 'Worksheet', null, '', '[]'::jsonb, null, null, null, 'coming_soon', 20),
  ('ai-at-work-starter-guide', 'AI-at-Work Starter Guide', 'Guide', null, '', '[]'::jsonb, null, null, null, 'coming_soon', 30)
on conflict (slug) do nothing;
