import { Bell, User, LogOut, Settings, Trophy, Package, Menu, Trash2, MessageCircle } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { PlayerSearch } from "@/components/PlayerSearch";
import { XPBar } from "@/components/XPBar";
import { getTierForLevel } from "@/utils/xpSystem";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationPanel } from "@/components/NotificationPanel";
import { AvatarSelectionModal } from "@/components/AvatarSelectionModal";
import { AuthModal } from "@/components/AuthModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { MessagingPanel } from "@/components/MessagingPanel";
import { PlayerSearchDropdown } from "@/components/PlayerSearchDropdown";
import { supabase } from "@/integrations/supabase/client";

export const Header = () => {
  const [practiceMode, setPracticeMode] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
  );
  const { user, profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { setOpen: setSidebarOpen } = useSidebar();
  const navigate = useNavigate();

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Real-time notification subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to challenges
    const challengesChannel = supabase
      .channel('challenges-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'challenges',
        filter: `challenged_id=eq.${user.id}`,
      }, () => {
        setUnreadNotifications(prev => prev + 1);
      })
      .subscribe();

    // Subscribe to friend requests
    const friendRequestsChannel = supabase
      .channel('friend-requests-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friend_requests',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        setUnreadNotifications(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(challengesChannel);
      supabase.removeChannel(friendRequestsChannel);
    };
  }, [user]);

  const handleOpenAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleOpenSocial = () => {
    setSidebarOpen(true);
    navigate("/social");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 glass-panel transition-all duration-300" style={{
        background: 'rgba(16, 20, 28, 0.95)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(61, 201, 119, 0.15)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
      }}>
        <div className="container mx-auto px-6 h-full max-w-screen-2xl">
          <div className="flex h-full items-center justify-between gap-4">
            {/* LEFT SIDE - Logo, Site Name, and Toggle */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Sidebar Toggle */}
              <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
              
              {/* Logo + Site Name */}
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-all">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <h1 className="hidden sm:block text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  CHESS.GG
                </h1>
              </Link>
            </div>

            {/* CENTER - Class Badge */}
            {user && (
              <div className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-card-dark border border-primary/30">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Class {profile?.class || 'D'}</span>
                </div>
              </div>
            )}

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Search Bar */}
              {user && (
                <div className="hidden md:block">
                  <PlayerSearchDropdown />
                </div>
              )}
              {user ? (
                <>
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-card-dark transition-colors"
                onClick={() => {
                  setNotificationOpen(true);
                  setUnreadNotifications(0);
                }}
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>

              {/* Messages */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-card-dark transition-colors"
                onClick={handleOpenSocial}
              >
                <MessageCircle className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>

                  {/* User Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 h-10 px-3 hover:bg-card-dark transition-all rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">B</span>
                        </div>
                        <div className="hidden lg:flex flex-col items-start">
                          <span className="text-xs font-medium text-foreground">{profile?.username || "Player"}</span>
                          <span className="text-xs text-primary">Level {(profile as any)?.level || 3}</span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-80 bg-card/95 backdrop-blur-xl border-border shadow-2xl p-4"
                  >
                    {/* Profile Header */}
                    <div className="flex items-start gap-3 pb-4 border-b border-border">
                      <Avatar className="h-16 w-16 border-2 border-primary cursor-pointer" onClick={() => setAvatarModalOpen(true)}>
                        <AvatarImage src={selectedAvatar} alt="Profile" />
                        <AvatarFallback className="bg-primary/10">
                          <User className="h-8 w-8 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-base font-bold text-foreground mb-1">
                          {profile?.username || "Player"}
                        </p>
                        <div className="inline-block px-2 py-0.5 rounded bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                          <span className="text-xs font-medium text-primary uppercase">
                            {getTierForLevel(profile?.level || 1).name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Level Progress with XPBar */}
                    <div className="py-4 border-b border-border">
                      <XPBar showDetails={true} compact={true} />
                    </div>

                    {/* Menu Items */}
                    <div className="py-2 space-y-1">
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card-dark cursor-pointer">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Profile</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link to="/inventory" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card-dark cursor-pointer">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Inventory</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card-dark cursor-pointer">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Achievements</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link to="/settings/customization" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card-dark cursor-pointer">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Settings</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-2" />

                      <DropdownMenuItem onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card-dark cursor-pointer">
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Desktop: Show buttons */}
                <div className="hidden md:flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenAuth("signin")}
                    className="border-border hover:border-primary/50 hover:bg-primary/5 text-foreground font-medium"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => handleOpenAuth("signup")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                  >
                    Get Started
                  </Button>
                </div>

                {/* Mobile: Show hamburger menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0">
                      <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:w-80 bg-card/95 backdrop-blur-xl border-primary/20">
                    <SheetHeader>
                      <SheetTitle className="text-left text-xl font-bold bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
                        ELITE LEAGUE
                      </SheetTitle>
                    </SheetHeader>
                    
                    <div className="mt-8 space-y-4">
                      {user ? (
                        <>
                          {/* Username Display for Logged-in Users */}
                          <Link
                            to="/profile"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block p-4 rounded-xl bg-gradient-to-br from-card-dark to-card border border-primary/20 hover:border-primary/50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-primary">
                                <AvatarImage src={selectedAvatar} alt="Profile" />
                                <AvatarFallback>
                                  <User className="h-6 w-6" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Logged in as</p>
                                <p className="text-base font-bold text-foreground">
                                  @{profile?.username || 'Player'}
                                </p>
                                <p className="text-xs text-primary">
                                  Class {profile?.class || 'D'} • {profile?.points || 0} $POINT
                                </p>
                              </div>
                            </div>
                          </Link>

                          <div className="h-px bg-border" />

                          <nav className="space-y-2">
                            <Link
                              to="/profile"
                              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card-dark transition-colors text-foreground"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <User className="h-5 w-5 text-primary" />
                              <span className="font-medium">Profile Settings</span>
                            </Link>
                            <Link
                              to="/dashboard"
                              className="block px-4 py-3 rounded-lg hover:bg-card-dark transition-colors text-foreground"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Dashboard
                            </Link>
                            <Link
                              to="/leaderboard"
                              className="block px-4 py-3 rounded-lg hover:bg-card-dark transition-colors text-foreground"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Leaderboard
                            </Link>
                            <Link
                              to="/tournaments"
                              className="block px-4 py-3 rounded-lg hover:bg-card-dark transition-colors text-foreground"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Tournaments
                            </Link>
                            <Link
                              to="/bot-game"
                              className="block px-4 py-3 rounded-lg hover:bg-card-dark transition-colors text-foreground"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Play vs Bot
                            </Link>
                          </nav>

                          <div className="h-px bg-border" />

                          <Button
                            onClick={signOut}
                            variant="outline"
                            className="w-full h-12 text-base border-destructive/20 hover:border-destructive hover:bg-destructive/10 text-destructive"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Button
                              onClick={() => handleOpenAuth("signin")}
                              variant="outline"
                              className="w-full h-12 text-base border-primary/20 hover:border-primary hover:bg-primary/10"
                            >
                              Login
                            </Button>
                            <Button
                              onClick={() => handleOpenAuth("signup")}
                              className="w-full h-12 text-base bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
                            >
                              Create Account
                            </Button>
                          </div>

                          <div className="h-px bg-border my-6" />

                          <nav className="space-y-2">
                            <Link
                              to="/dashboard"
                              className="block px-4 py-3 rounded-lg hover:bg-card-dark transition-colors text-foreground"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Dashboard
                            </Link>
                            <Link
                              to="/leaderboard"
                              className="block px-4 py-3 rounded-lg hover:bg-card-dark transition-colors text-foreground"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Leaderboard
                            </Link>
                            <Link
                              to="/tournaments"
                              className="block px-4 py-3 rounded-lg hover:bg-card-dark transition-colors text-foreground"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Tournaments
                            </Link>
                            <Link
                              to="/bot-game"
                              className="block px-4 py-3 rounded-lg hover:bg-card-dark transition-colors text-foreground"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Play vs Bot
                            </Link>
                          </nav>
                        </>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <NotificationPanel open={notificationOpen} onOpenChange={setNotificationOpen} />
      <MessagingPanel 
        open={messagingOpen} 
        onClose={() => setMessagingOpen(false)}
        unreadCount={unreadMessages}
        onUnreadUpdate={setUnreadMessages}
      />
      <AvatarSelectionModal
        open={avatarModalOpen}
        onOpenChange={setAvatarModalOpen}
        selectedAvatar={selectedAvatar}
        onSelectAvatar={setSelectedAvatar}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  );
};
