ALTER TABLE public.profiles_settings
  ADD COLUMN IF NOT EXISTS weather_location text NOT NULL DEFAULT 'Amsterdam',
  ADD COLUMN IF NOT EXISTS weather_lat double precision NOT NULL DEFAULT 52.3676,
  ADD COLUMN IF NOT EXISTS weather_lon double precision NOT NULL DEFAULT 4.9041;