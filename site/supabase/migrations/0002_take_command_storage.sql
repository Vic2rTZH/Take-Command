-- Storage: private bucket for the PDFs, public bucket for cover images.
insert into storage.buckets (id, name, public) values ('tc-files', 'tc-files', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('tc-public', 'tc-public', true) on conflict (id) do nothing;
