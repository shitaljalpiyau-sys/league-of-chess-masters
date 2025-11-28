import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to determine if the identifier is an email or username
 * and get the corresponding email for login
 */
export const getEmailFromIdentifier = async (identifier: string): Promise<string | null> => {
  // Check if identifier looks like an email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (emailRegex.test(identifier)) {
    // It's already an email
    return identifier;
  }
  
  // It's a username, look up the email
  const { data, error } = await supabase.rpc('get_user_by_username_or_email', {
    identifier: identifier
  });
  
  if (error || !data || data.length === 0) {
    console.error('Error finding user:', error);
    return null;
  }
  
  return data[0].email;
};

/**
 * Generate a random username
 */
export const generateRandomUsername = (): string => {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `Player${randomString}`;
};
