import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PageCustomizationProvider } from "./contexts/PageCustomizationContext";
import { MainLayout } from "./layouts/MainLayout";
import { RequireAuth } from "./components/RequireAuth";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import PlayNow from "./pages/PlayNow";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Marketplace from "./pages/Marketplace";
import Leaderboard from "./pages/Leaderboard";
import TournamentDetails from "./pages/TournamentDetails";
import ThemeInventory from "./pages/ThemeInventory";
import ThemeStore from "./pages/ThemeStore";
import Support from "./pages/Support";
import Friends from "./pages/Friends";
import Social from "./pages/Social";
import Challenges from "./pages/Challenges";
import Game from "./pages/Game";
import ChallengeArena from "./pages/ChallengeArena";
import BotGame from "./pages/BotGame";
import NotFound from "./pages/NotFound";
import PageCustomization from "./pages/PageCustomization";
import GlobalChat from "./pages/GlobalChat";
import NoticeBoard from "./pages/NoticeBoard";
import LiveSpectate from "./pages/LiveSpectate";
import SpectateGame from "./pages/SpectateGame";
import Replay from "./pages/Replay";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NextThemesProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <PageCustomizationProvider>
              <Routes>
                {/* Landing page */}
                <Route path="/" element={<Landing />} />
                
                {/* Main app routes with MainLayout */}
                <Route element={<MainLayout />}>
                  {/* Public routes - accessible to guests */}
                  <Route path="/dashboard" element={<Index />} />
                  <Route path="/app" element={<Index />} />
                  <Route path="/bot-game" element={<BotGame />} />
                  <Route path="/play/bot" element={<BotGame />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/tournament/:id" element={<TournamentDetails />} />
                  <Route path="/spectate" element={<LiveSpectate />} />
                  <Route path="/spectate/:gameId" element={<SpectateGame />} />
                  <Route path="/replay/:gameId" element={<Replay />} />
                  <Route path="/profile/:userId" element={<PublicProfile />} />
                  <Route path="/global-chat" element={<GlobalChat />} />
                  <Route path="/notice-board" element={<NoticeBoard />} />
                  <Route path="/support" element={<Support />} />
                  
                  {/* Protected routes - require authentication */}
                  <Route path="/play" element={<RequireAuth><PlayNow /></RequireAuth>} />
                  <Route path="/game/:id" element={<RequireAuth><Game /></RequireAuth>} />
                  <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  <Route path="/marketplace" element={<RequireAuth><Marketplace /></RequireAuth>} />
                  <Route path="/challenges" element={<RequireAuth><Challenges /></RequireAuth>} />
                  <Route path="/arena" element={<RequireAuth><ChallengeArena /></RequireAuth>} />
                  <Route path="/inventory" element={<RequireAuth><ThemeInventory /></RequireAuth>} />
                  <Route path="/theme-store" element={<RequireAuth><ThemeStore /></RequireAuth>} />
                  <Route path="/settings/customization" element={<RequireAuth><PageCustomization /></RequireAuth>} />
                  <Route path="/social" element={<RequireAuth><Social /></RequireAuth>} />
                  <Route path="/friends" element={<RequireAuth><Friends /></RequireAuth>} />
                </Route>
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageCustomizationProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </NextThemesProvider>
  </QueryClientProvider>
);

export default App;
