DROP POLICY IF EXISTS "Signed-in read client logos" ON storage.objects;
CREATE POLICY "Read own client logo or admin" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-logos' AND (public.has_role(auth.uid(),'admin') OR (storage.foldername(name))[1] = public.current_client_id()::text));