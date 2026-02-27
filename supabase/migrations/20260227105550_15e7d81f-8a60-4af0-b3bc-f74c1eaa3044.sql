ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sensor_width double precision,
ADD COLUMN IF NOT EXISTS sensor_height double precision,
ADD COLUMN IF NOT EXISTS pixel_size double precision;