import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { generateUsername } from "@/utils/usernameGenerator";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(16, "Username must be at most 16 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

const signInSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
}

export const AuthModal = ({ isOpen, onClose, mode: initialMode }: AuthModalProps) => {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "", 
    username: generateUsername() 
  });
  const [usernameError, setUsernameError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Sync mode with prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Auto-generate username when modal opens or mode changes to signup
  useEffect(() => {
    if (isOpen && mode === "signup") {
      setFormData(prev => ({ ...prev, username: generateUsername() }));
      setUsernameError("");
      setUsernameAvailable(null);
    }
  }, [isOpen, mode]);

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3 || mode !== "signup") {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (error) throw error;
      setUsernameAvailable(!data);
      setUsernameError(data ? "Username is already taken" : "");
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Debounced username check
  useEffect(() => {
    if (mode !== "signup") return;
    
    const timer = setTimeout(() => {
      if (formData.username.length >= 3) {
        checkUsernameAvailability(formData.username);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, mode]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions",
      });
      setMode("signin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const validation = signUpSchema.safeParse(formData);
        if (!validation.success) {
          toast({
            title: "Validation Error",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { username: formData.username },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          // Check if error is username taken
          if (error.message.includes("username") || error.message.includes("unique")) {
            setUsernameError("Username is already taken");
            setLoading(false);
            return;
          }
          throw error;
        }

        toast({
          title: "Account Created!",
          description: "Welcome to Elite League Chess Arena",
        });
        onClose();
      } else {
        const validation = signInSchema.safeParse({ username: formData.username, password: formData.password });
        if (!validation.success) {
          toast({
            title: "Validation Error",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Look up email by username
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", formData.username)
          .single();

        if (profileError || !profileData) {
          toast({
            title: "Login Failed",
            description: "Username not found",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Sign in with email and password
        const { error } = await supabase.auth.signInWithPassword({
          email: profileData.email,
          password: formData.password,
        });

        if (error) {
          toast({
            title: "Login Failed",
            description: "Invalid username or password",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        toast({
          title: "Welcome Back!",
          description: "Successfully signed in",
        });
        onClose();
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${
        isMobile 
          ? "fixed inset-0 h-full w-full max-w-full rounded-none p-6 flex flex-col" 
          : "sm:max-w-[440px]"
      } bg-background border border-border`}>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        
        <DialogHeader className={`${isMobile ? "mt-8" : ""} space-y-2`}>
          <DialogTitle className="text-2xl font-bold text-center text-foreground">
            {mode === "signup" ? "Create Account" : mode === "forgot" ? "Reset Password" : "Welcome Back"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {mode === "signup" 
              ? "Join Elite League Chess Arena" 
              : mode === "forgot"
              ? "Enter your email to receive reset instructions"
              : "Sign in to continue playing"}
          </DialogDescription>
        </DialogHeader>
        
        {mode === "forgot" ? (
          <form onSubmit={handleForgotPassword} className={`space-y-6 ${isMobile ? "mt-8 flex-1 flex flex-col" : "mt-6"}`}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`${isMobile ? "h-12 text-base" : "h-11"}`}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading}
                className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold ${
                  isMobile ? "h-12 text-base" : "h-11"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode("signin")}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className={`space-y-6 ${isMobile ? "mt-8 flex-1 flex flex-col" : "mt-6"}`}>
            <div className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a unique username"
                      value={formData.username}
                      onChange={(e) => {
                        setFormData({ ...formData, username: e.target.value });
                        setUsernameError("");
                        setUsernameAvailable(null);
                      }}
                      className={`${isMobile ? "h-12 text-base" : "h-11"} pr-10`}
                      required
                      minLength={3}
                      maxLength={16}
                      pattern="[a-zA-Z0-9_]+"
                    />
                    {checkingUsername && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                    )}
                  </div>
                  {usernameError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {usernameError}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    3-16 characters: letters, numbers, and underscores only
                  </p>
                </div>
              )}
              
              {mode === "signin" ? (
                <div className="space-y-2">
                  <Label htmlFor="signin-username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="signin-username"
                    type="text"
                    placeholder="Your username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`${isMobile ? "h-12 text-base" : "h-11"}`}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`${isMobile ? "h-12 text-base" : "h-11"}`}
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`${isMobile ? "h-12 text-base" : "h-11"}`}
                  required
                  minLength={6}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading || (mode === "signup" && usernameAvailable === false)}
                className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold ${
                  isMobile ? "h-12 text-base" : "h-11"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "signup" ? "Creating Account..." : "Signing In..."}
                  </>
                ) : (
                  mode === "signup" ? "Create Account" : "Sign In"
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                {mode === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="text-primary hover:underline font-medium"
                    >
                    Create Account
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
