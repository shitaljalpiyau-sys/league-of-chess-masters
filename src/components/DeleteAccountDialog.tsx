import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountDialog = ({
  open,
  onOpenChange,
}: DeleteAccountDialogProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: 'Please type "DELETE" to confirm',
        variant: "destructive",
      });
      return;
    }

    if (!profile) return;

    setDeleting(true);

    try {
      // Delete all user data in order (respecting foreign key constraints)
      
      // 1. Delete challenge limits
      await supabase
        .from("challenge_limits")
        .delete()
        .eq("user_id", profile.id);

      // 2. Delete user themes
      await supabase
        .from("user_themes")
        .delete()
        .eq("user_id", profile.id);

      // 3. Delete theme preferences
      await supabase
        .from("user_theme_preferences")
        .delete()
        .eq("user_id", profile.id);

      // 4. Delete page preferences
      await supabase
        .from("user_page_preferences")
        .delete()
        .eq("user_id", profile.id);

      // 5. Delete user NFTs
      await supabase
        .from("user_nfts")
        .delete()
        .eq("user_id", profile.id);

      // 6. Delete weekly rankings
      await supabase
        .from("weekly_rankings")
        .delete()
        .eq("user_id", profile.id);

      // 7. Delete friendships
      await supabase
        .from("friendships")
        .delete()
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`);

      // 8. Delete friend requests
      await supabase
        .from("friend_requests")
        .delete()
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

      // 9. Delete direct messages
      await supabase
        .from("direct_messages")
        .delete()
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

      // 10. Delete game messages
      await supabase
        .from("game_messages")
        .delete()
        .eq("user_id", profile.id);

      // 11. Delete game spectators
      await supabase
        .from("game_spectators")
        .delete()
        .eq("user_id", profile.id);

      // 12. Delete challenges (as challenger or challenged)
      await supabase
        .from("challenges")
        .delete()
        .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`);

      // 13. Delete matchmaking queue entries
      await supabase
        .from("matchmaking_queue")
        .delete()
        .eq("user_id", profile.id);

      // 14. Delete global chat messages
      await supabase
        .from("global_chat_messages")
        .delete()
        .eq("user_id", profile.id);

      // 15. Delete class upgrade requests
      await supabase
        .from("class_upgrade_requests")
        .delete()
        .eq("user_id", profile.id);

      // 16. Update games to remove user references (can't delete due to match history)
      // Set games to anonymous player if user was participant
      await supabase
        .from("games")
        .update({ status: "abandoned" })
        .or(`white_player_id.eq.${profile.id},black_player_id.eq.${profile.id}`)
        .eq("status", "active");

      // 17. Finally, delete the profile
      await supabase
        .from("profiles")
        .delete()
        .eq("id", profile.id);

      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted",
      });

      // Sign out and redirect
      await signOut();
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl">
              Delete Account
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p className="text-base font-semibold text-foreground">
              This action is permanent and cannot be undone.
            </p>
            <p>All of your data will be permanently deleted:</p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-2">
              <li>Profile and username</li>
              <li>Rating and class progress</li>
              <li>Points and purchases</li>
              <li>Match history and statistics</li>
              <li>Challenge records</li>
              <li>Friends and messages</li>
              <li>All settings and preferences</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4">
          <Label htmlFor="confirm" className="text-sm font-medium mb-2 block">
            Type <span className="font-bold text-destructive">DELETE</span> to
            confirm:
          </Label>
          <Input
            id="confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="font-mono"
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmText !== "DELETE" || deleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleting ? "Deleting..." : "Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
