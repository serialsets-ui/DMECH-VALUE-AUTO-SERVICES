-- Real vehicle photos — first use of Supabase Storage in this project.
-- Public bucket (unlike justra-web's/oro's private-bucket + signed-URL
-- pattern): vehicle photos need to be visible to anonymous marketing-site
-- visitors, matching the existing "public read pipeline vehicles" RLS
-- policy on the vehicles table itself. Uploads still only ever happen
-- through a service-role route handler (src/app/api/vehicles/[id]/photos/
-- route.ts), never a direct client-side upload — same discipline as the
-- sibling repos, just a public read model instead of signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-photos', 'vehicle-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "staff upload vehicle photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vehicle-photos' and dmech_is_staff());

create policy "staff delete vehicle photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vehicle-photos' and dmech_is_staff());

-- Belt-and-braces: the public bucket's direct URL path doesn't need this to
-- serve images, but it keeps authenticated read APIs (.list()/.download())
-- consistent with the same public-read intent.
create policy "public read vehicle photos" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'vehicle-photos');
