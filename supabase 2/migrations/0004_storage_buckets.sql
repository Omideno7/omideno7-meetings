-- OmideNo7 Meetings — Step 20 Storage Buckets
insert into storage.buckets (id, name, public) values
('recordings','recordings',false),
('transcripts','transcripts',false),
('avatars','avatars',false),
('church-assets','church-assets',true)
on conflict (id) do nothing;
