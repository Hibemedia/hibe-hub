ALTER TABLE public.daily_stats DROP CONSTRAINT daily_stats_network_check;
ALTER TABLE public.daily_stats ADD CONSTRAINT daily_stats_network_check CHECK (network = ANY (ARRAY['ig','tt','yt','fb','li','th']));
ALTER TABLE public.videos DROP CONSTRAINT videos_network_check;
ALTER TABLE public.videos ADD CONSTRAINT videos_network_check CHECK (network = ANY (ARRAY['ig','tt','yt','fb','li','th']));