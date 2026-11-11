CREATE TABLE public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('channel','dm','group')),
  name text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.chat_members (
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  body text NOT NULL DEFAULT '',
  image_path text,
  mentions uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);
CREATE INDEX chat_messages_room_idx ON public.chat_messages(room_id, created_at);
CREATE TABLE public.chat_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  kind text NOT NULL,
  actor_id uuid,
  preview text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX chat_notifications_recipient_idx ON public.chat_notifications(recipient_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_rooms, public.chat_members, public.chat_messages TO authenticated;
GRANT SELECT, UPDATE ON public.chat_notifications TO authenticated;
GRANT ALL ON public.chat_rooms, public.chat_members, public.chat_messages, public.chat_notifications TO service_role;

CREATE OR REPLACE FUNCTION public.is_chat_member(_room uuid, _user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user,'admin') AND EXISTS (SELECT 1 FROM public.chat_members WHERE room_id = _room AND user_id = _user)
$$;

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read rooms" ON public.chat_rooms FOR SELECT TO authenticated
  USING (public.is_chat_member(id, auth.uid()) OR (public.has_role(auth.uid(),'admin') AND created_by = auth.uid()));
CREATE POLICY "Admins create rooms" ON public.chat_rooms FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND created_by = auth.uid());
CREATE POLICY "Members rename rooms" ON public.chat_rooms FOR UPDATE TO authenticated
  USING (public.is_chat_member(id, auth.uid())) WITH CHECK (public.is_chat_member(id, auth.uid()));
CREATE POLICY "Members delete rooms" ON public.chat_rooms FOR DELETE TO authenticated
  USING (public.is_chat_member(id, auth.uid()) AND kind <> 'dm');

CREATE POLICY "Members read membership" ON public.chat_members FOR SELECT TO authenticated
  USING (public.is_chat_member(room_id, auth.uid()));
CREATE POLICY "Members add members" ON public.chat_members FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND public.has_role(user_id,'admin') AND (
    public.is_chat_member(room_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id AND r.created_by = auth.uid())));
CREATE POLICY "Own read marker" ON public.chat_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members remove members" ON public.chat_members FOR DELETE TO authenticated
  USING (public.is_chat_member(room_id, auth.uid()));

CREATE POLICY "Members read messages" ON public.chat_messages FOR SELECT TO authenticated
  USING (public.is_chat_member(room_id, auth.uid()));
CREATE POLICY "Members send messages" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_chat_member(room_id, auth.uid()));
CREATE POLICY "Authors edit messages" ON public.chat_messages FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_chat_member(room_id, auth.uid())) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Authors delete messages" ON public.chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_chat_member(room_id, auth.uid()));

CREATE POLICY "Own chat notifications" ON public.chat_notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Mark own chat notifications" ON public.chat_notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

CREATE OR REPLACE FUNCTION public.chat_message_notify() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k text; prev text := left(coalesce(nullif(NEW.body,''),'Afbeelding'), 140);
BEGIN
  SELECT kind INTO k FROM public.chat_rooms WHERE id = NEW.room_id;
  UPDATE public.chat_members SET last_read_at = NEW.created_at WHERE room_id = NEW.room_id AND user_id = NEW.user_id;
  IF k = 'dm' THEN
    INSERT INTO public.chat_notifications (recipient_id, room_id, message_id, kind, actor_id, preview)
    SELECT m.user_id, NEW.room_id, NEW.id, 'dm', NEW.user_id, prev FROM public.chat_members m
    WHERE m.room_id = NEW.room_id AND m.user_id <> NEW.user_id;
  ELSE
    INSERT INTO public.chat_notifications (recipient_id, room_id, message_id, kind, actor_id, preview)
    SELECT DISTINCT m.user_id, NEW.room_id, NEW.id, 'mention', NEW.user_id, prev FROM public.chat_members m
    WHERE m.room_id = NEW.room_id AND m.user_id <> NEW.user_id AND m.user_id = ANY(NEW.mentions);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER chat_message_notify AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.chat_message_notify();

CREATE OR REPLACE FUNCTION public.chat_unread() RETURNS TABLE(room_id uuid, unread bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.room_id, count(x.id) FROM public.chat_members m
  LEFT JOIN public.chat_messages x ON x.room_id = m.room_id AND x.created_at > m.last_read_at AND x.user_id <> m.user_id
  WHERE m.user_id = auth.uid() AND public.has_role(auth.uid(),'admin')
  GROUP BY m.room_id
$$;

CREATE OR REPLACE FUNCTION public.chat_open_dm(_other uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') OR NOT public.has_role(_other,'admin') OR _other = auth.uid() THEN RAISE EXCEPTION 'Niet toegestaan'; END IF;
  SELECT r.id INTO rid FROM public.chat_rooms r
   WHERE r.kind = 'dm' AND EXISTS (SELECT 1 FROM public.chat_members WHERE room_id = r.id AND user_id = auth.uid())
     AND EXISTS (SELECT 1 FROM public.chat_members WHERE room_id = r.id AND user_id = _other) LIMIT 1;
  IF rid IS NULL THEN
    INSERT INTO public.chat_rooms (kind, created_by) VALUES ('dm', auth.uid()) RETURNING id INTO rid;
    INSERT INTO public.chat_members (room_id, user_id) VALUES (rid, auth.uid()), (rid, _other);
  END IF;
  RETURN rid;
END $$;
REVOKE EXECUTE ON FUNCTION public.chat_open_dm(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.chat_unread() FROM anon;

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;

CREATE POLICY "Chat members read images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-images' AND public.is_chat_member(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "Chat members upload images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-images' AND public.is_chat_member(((storage.foldername(name))[1])::uuid, auth.uid()));