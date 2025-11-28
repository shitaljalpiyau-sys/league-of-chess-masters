-- Create friend_groups table for organizing friends
CREATE TABLE IF NOT EXISTS public.friend_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL DEFAULT 'Others',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS on friend_groups
ALTER TABLE public.friend_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for friend_groups
CREATE POLICY "Users can manage their own friend groups"
ON public.friend_groups
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  reactor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, reactor_id, emoji)
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_reactions
CREATE POLICY "Users can view reactions on their messages"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.direct_messages
    WHERE id = message_id
    AND (sender_id = auth.uid() OR receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can add reactions to messages they can see"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = reactor_id
  AND EXISTS (
    SELECT 1 FROM public.direct_messages
    WHERE id = message_id
    AND (sender_id = auth.uid() OR receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their own reactions"
ON public.message_reactions
FOR DELETE
USING (auth.uid() = reactor_id);

-- Create blocks table for blocking users
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);

-- Enable RLS on blocks
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for blocks
CREATE POLICY "Users can manage their own blocks"
ON public.blocks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add deleted flag to direct_messages
ALTER TABLE public.direct_messages
ADD COLUMN IF NOT EXISTS deleted_for_sender BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_for_receiver BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_friend_groups_user_id ON public.friend_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_blocks_user_id ON public.blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_user_id ON public.blocks(blocked_user_id);