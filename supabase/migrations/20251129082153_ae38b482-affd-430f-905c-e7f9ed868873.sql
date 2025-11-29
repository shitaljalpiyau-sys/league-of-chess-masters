-- Create master_learning table for tracking player patterns
CREATE TABLE IF NOT EXISTS public.master_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  openings_used JSONB DEFAULT '[]'::jsonb,
  blunder_squares JSONB DEFAULT '[]'::jsonb,
  weak_squares JSONB DEFAULT '[]'::jsonb,
  preferred_moves JSONB DEFAULT '[]'::jsonb,
  losing_patterns JSONB DEFAULT '[]'::jsonb,
  win_patterns JSONB DEFAULT '[]'::jsonb,
  average_attack_direction TEXT DEFAULT 'center',
  learning_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.master_learning ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own learning data"
  ON public.master_learning
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning data"
  ON public.master_learning
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning data"
  ON public.master_learning
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_master_learning_updated_at
  BEFORE UPDATE ON public.master_learning
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();