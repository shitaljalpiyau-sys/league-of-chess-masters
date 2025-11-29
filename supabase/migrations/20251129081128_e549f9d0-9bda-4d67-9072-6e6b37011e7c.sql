-- Create master_progress table to track Master AI progression
CREATE TABLE IF NOT EXISTS public.master_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  master_xp INTEGER NOT NULL DEFAULT 0,
  master_level INTEGER NOT NULL DEFAULT 1,
  last_power_used INTEGER,
  total_matches INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.master_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own master progress"
  ON public.master_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own master progress"
  ON public.master_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own master progress"
  ON public.master_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_master_progress_user_id ON public.master_progress(user_id);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_master_progress_updated_at
  BEFORE UPDATE ON public.master_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();