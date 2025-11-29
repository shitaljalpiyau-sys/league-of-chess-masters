-- Drop existing master_learning table and recreate with new schema
DROP TABLE IF EXISTS public.master_learning CASCADE;

CREATE TABLE public.master_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opening_code TEXT NOT NULL,
  move_sequence TEXT NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 1,
  losses_with_sequence INTEGER NOT NULL DEFAULT 0,
  wins_with_sequence INTEGER NOT NULL DEFAULT 0,
  blunders_detected INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, move_sequence)
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

-- Index for fast lookup
CREATE INDEX idx_master_learning_user_sequence ON public.master_learning(user_id, move_sequence);
CREATE INDEX idx_master_learning_opening ON public.master_learning(user_id, opening_code);