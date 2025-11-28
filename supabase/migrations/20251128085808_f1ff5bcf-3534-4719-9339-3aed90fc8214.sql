-- Create chat_rooms table for tracking 1-to-1 conversations
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view their chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create chat rooms"
  ON public.chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Add chat_room_id to direct_messages
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_users ON public.chat_rooms(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_chat_room ON public.direct_messages(chat_room_id);

-- Function to auto-delete old global chat messages (keep only 1000)
CREATE OR REPLACE FUNCTION public.cleanup_global_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete messages older than the 1000 most recent ones for this class
  DELETE FROM public.global_chat_messages
  WHERE class = NEW.class
  AND id NOT IN (
    SELECT id FROM public.global_chat_messages
    WHERE class = NEW.class
    ORDER BY created_at DESC
    LIMIT 1000
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to cleanup after each insert
DROP TRIGGER IF EXISTS trigger_cleanup_global_chat ON public.global_chat_messages;
CREATE TRIGGER trigger_cleanup_global_chat
  AFTER INSERT ON public.global_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_global_chat();

-- Add avatar_url to global_chat_messages for easier querying
ALTER TABLE public.global_chat_messages ADD COLUMN IF NOT EXISTS avatar_url TEXT;