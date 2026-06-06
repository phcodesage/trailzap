-- 090_storage.sql
-- Storage buckets + object policies. Convention: files live under a top-level
-- folder named after the owner's uid, e.g. `avatars/<uid>/photo.png`, so the
-- first path segment is checked against auth.uid().

insert into storage.buckets (id, name, public)
values
  ('avatars',         'avatars',         true),
  ('activity-photos', 'activity-photos', true),
  ('gpx',             'gpx',             false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- avatars (public read, owner write)
-- ---------------------------------------------------------------------------
drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- activity-photos (public read, owner write)
-- ---------------------------------------------------------------------------
drop policy if exists activity_photos_read on storage.objects;
create policy activity_photos_read on storage.objects
  for select using (bucket_id = 'activity-photos');

drop policy if exists activity_photos_insert_own on storage.objects;
create policy activity_photos_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'activity-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists activity_photos_update_own on storage.objects;
create policy activity_photos_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'activity-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'activity-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists activity_photos_delete_own on storage.objects;
create policy activity_photos_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'activity-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- gpx (private: owner-only for all operations)
-- ---------------------------------------------------------------------------
drop policy if exists gpx_select_own on storage.objects;
create policy gpx_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'gpx' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists gpx_insert_own on storage.objects;
create policy gpx_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gpx' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists gpx_update_own on storage.objects;
create policy gpx_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'gpx' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'gpx' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists gpx_delete_own on storage.objects;
create policy gpx_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'gpx' and (storage.foldername(name))[1] = auth.uid()::text);
