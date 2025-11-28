import { Search, Bell, User, LogOut, Settings, Trophy, Package, Menu, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { PlayerSearch } from "@/components/PlayerSearch";
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

export const Header = () => {
  const [practiceMode, setPracticeMode] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
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

  const unreadCount = 2;

  const handleOpenAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 glass-panel scan-line-effect neon-glow" style={{
        background: 'rgba(10, 16, 32, 0.85)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0, 229, 255, 0.35)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 20px rgba(0, 229, 255, 0.15)'
      }}>
        <div className="container mx-auto px-4 sm:px-6 h-full">
          <div className="flex h-full items-center justify-between gap-2 sm:gap-4">
            {/* LEFT SIDE - Logo, Site Name, and Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Logo + Site Name */}
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 glass-button rounded-lg flex items-center justify-center group-hover:scale-110 transition-all animate-neon-pulse">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <h1 className="hidden sm:block text-lg font-bold font-rajdhani text-foreground tracking-wider group-hover:text-primary transition-colors neon-glow">
                  ELITE LEAGUE
                </h1>
              </Link>
              
              {/* Sidebar Toggle */}
              <SidebarTrigger className="text-foreground hover:text-primary transition-colors ml-1" />
              
              {/* Practice Mode Switch */}
              <div className="hidden xl:flex items-center gap-3 ml-2">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Practice Mode
                </span>
                <Switch checked={practiceMode} onCheckedChange={setPracticeMode} />
              </div>
            </div>

            {/* CENTER - CLASS BADGE */}
            {user && (
              <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
                <div className="px-3 sm:px-4 py-1.5 rounded-full border-2 border-primary bg-card-darker shadow-lg">
                  <span className="text-xs font-bold text-primary tracking-wider whitespace-nowrap">
                    CLASS {profile?.class || "D"}
                  </span>
                </div>
              </div>
            )}

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {user ? (
                <>
                  {/* Search Bar */}
                  <div className="hidden lg:block w-48 xl:w-64">
                    <div className="scale-90">
                      <PlayerSearch 
                        placeholder="Search players..."
                        showSpectateButton={true}
                      />
                    </div>
                  </div>
                  
                  {/* Points Display */}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-card-dark rounded-lg border border-border hover:border-primary/50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                    <span className="text-sm font-bold text-foreground whitespace-nowrap">
                      {profile?.points || 0}
                    </span>
                    <span className="text-xs font-semibold text-primary whitespace-nowrap">$POINT</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 sm:h-11 sm:w-11 hover:bg-card-dark flex-shrink-0"
                    onClick={() => setNotificationOpen(true)}
                  >
                    <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-foreground hover:text-primary transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-destructive rounded-full flex items-center justify-center text-xs font-bold text-destructive-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-primary transition-all flex-shrink-0"
                      >
                        <Avatar className="h-9 w-9 border-2 border-border hover:border-primary transition-colors">
                          <AvatarImage src={selectedAvatar} alt="Profile" />
                          <AvatarFallback className="bg-card-darker">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-72 bg-card border-border shadow-xl p-2"
                  >
                    <DropdownMenuLabel className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          className="h-12 w-12 border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setAvatarModalOpen(true)}
                        >
                          <AvatarImage src={selectedAvatar} alt="Profile" />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-bold text-foreground">
                            {profile?.username || "Player"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Class {profile?.class || "D"}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-border" />

                    <div className="px-3 py-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Class Level</span>
                        <span className="text-sm font-bold text-primary">
                          Class {profile?.class || "D"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Points</span>
                        <span className="text-sm font-bold text-foreground">
                          {profile?.points || 0} $POINT
                        </span>
                      </div>
                    </div>

                    <DropdownMenuSeparator className="bg-border" />

                    <DropdownMenuItem asChild>
                      <Link
                        to="/profile"
                        className="cursor-pointer flex items-center gap-2 px-3 py-2"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        to="/inventory"
                        className="cursor-pointer flex items-center gap-2 px-3 py-2"
                      >
                        <Package className="h-4 w-4" />
                        <span>Inventory</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        to="/settings/customization"
                        className="cursor-pointer flex items-center gap-2 px-3 py-2"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem disabled className="px-3 py-2 opacity-50">
                      <Trophy className="h-4 w-4 mr-2" />
                      <span>Achievements</span>
                      <span className="ml-auto text-xs text-muted-foreground">(Coming Soon)</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-border" />

                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="cursor-pointer text-destructive focus:text-destructive px-3 py-2"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span>Delete Account</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={signOut}
                      className="cursor-pointer px-3 py-2"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Desktop: Show buttons */}
                <div className="hidden md:flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenAuth("signin")}
                    className="border-primary/20 hover:border-primary hover:bg-primary/10 text-foreground text-sm"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => handleOpenAuth("signup")}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-sm"
                  >
                    Create Account
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
