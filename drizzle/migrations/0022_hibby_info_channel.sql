DO $$ DECLARE rid uuid; BEGIN
  SELECT id INTO rid FROM public.chat_rooms WHERE kind='channel' AND name='Informatie' LIMIT 1;
  IF rid IS NULL THEN
    INSERT INTO public.chat_rooms(kind,name) VALUES ('channel','Informatie') RETURNING id INTO rid;
  END IF;
  INSERT INTO public.chat_members(room_id,user_id)
    SELECT rid, user_id FROM public.user_roles WHERE role='admin' ON CONFLICT DO NOTHING;
END $$;