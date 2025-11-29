import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { Crown } from "lucide-react";

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(217, 119, 6, 0.2) 2px, transparent 2px),
              linear-gradient(90deg, rgba(217, 119, 6, 0.2) 2px, transparent 2px)
            `,
            backgroundSize: "60px 60px",
            animation: "gridMove 20s linear infinite",
          }}
        />
        <div className="fixed w-[800px] h-[800px] rounded-full blur-[150px] opacity-20 -top-[300px] -right-[300px] bg-gradient-radial from-primary to-transparent animate-pulse" />
        <div className="fixed w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 -bottom-[200px] -left-[200px] bg-gradient-radial from-amber-500 to-transparent animate-pulse" style={{ animationDelay: "3s" }} />
      </div>

      {/* Logo */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-3">
        <Crown className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]" />
        <span className="text-2xl font-black bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
          ELITE LEAGUE
        </span>
      </div>

      {/* Auth Modal - Always Open */}
      <AuthModal
        isOpen={true}
        onClose={() => navigate("/")}
        mode={authMode}
      />

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
      `}</style>
    </div>
  );
};

export default Auth;
