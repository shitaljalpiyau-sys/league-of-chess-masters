import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";

interface ProtectedActionProps {
  children: ReactNode;
  action: string;
  fallback?: ReactNode;
}

export const ProtectedAction = ({ children, action, fallback }: ProtectedActionProps) => {
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      e.stopPropagation();
      setAuthModalOpen(true);
    }
  };

  if (!user && fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div onClick={handleClick}>
        {children}
      </div>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode="signup"
      />
    </>
  );
};
