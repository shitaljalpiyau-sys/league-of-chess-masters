-- Add last_points_update column to track when points were last calculated
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_points_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Update existing rows to have current timestamp
UPDATE public.profiles 
SET last_points_update = now() 
WHERE last_points_update IS NULL;