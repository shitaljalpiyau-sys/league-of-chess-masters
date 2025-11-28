import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { ChallengeNotification } from "@/components/ChallengeNotification";
import { motion } from "framer-motion";

export const MainLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: 'clamp(4rem, 4rem, 260px)' }}>
          <Header />
          {user && <ChallengeNotification />}
          <main className="flex-1 pt-16 overflow-auto">
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};
