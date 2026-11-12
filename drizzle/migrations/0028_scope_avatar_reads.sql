DROP POLICY IF EXISTS "Signed-in users read avatars" ON storage.objects;
CREATE POLICY "Signed-in users read avatars" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (
  (storage.foldername(name))[1] = (auth.uid())::text
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = (storage.foldername(name))[1]
    AND (public.has_role(u.id,'admin') OR (u.client_id IS NOT NULL AND u.client_id = public.current_client_id())))
));