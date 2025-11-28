import { Home, ShoppingCart, MessageSquare, Trophy, Users, Swords, Target, Coins, Package, Settings, HeadphonesIcon, FileText, Eye } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "HOME", url: "/", icon: Home },
  { title: "PLAY NOW", url: "/play", icon: Target },
  { title: "CHALLENGES", url: "/challenges", icon: Swords },
  { title: "CHALLENGE ARENA", url: "/arena", icon: Target },
  { title: "LIVE SPECTATE", url: "/spectate", icon: Eye },
  { title: "LEADERBOARD", url: "/leaderboard", icon: Trophy },
  { title: "MARKETPLACE", url: "/marketplace", icon: ShoppingCart },
  { title: "INVENTORY", url: "/inventory", icon: Package },
  { title: "PROFILE", url: "/profile", icon: Users },
  { title: "FRIENDS", url: "/friends", icon: Users },
  { title: "GLOBAL CHAT", url: "/global-chat", icon: MessageSquare },
  { title: "NOTICE BOARD", url: "/notice-board", icon: FileText },
];

const settingsItems = [
  { title: "SUPPORT", url: "/support", icon: HeadphonesIcon },
  { title: "SETTING", url: "/settings/customization", icon: Settings },
];

export const AppSidebar = () => {
  const { open } = useSidebar();

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl transition-all duration-300 ease-in-out scan-line-effect neon-glow"
      style={{ 
        position: 'fixed',
        top: '3.5rem',
        bottom: 0,
        left: 0,
        height: 'calc(100vh - 3.5rem)',
        width: open ? 'clamp(200px, 20vw, 250px)' : '3.5rem',
        minWidth: open ? '200px' : '3.5rem',
        zIndex: 40,
        background: 'rgba(10, 16, 32, 0.85)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(0, 229, 255, 0.35)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 4px 0 20px rgba(0, 229, 255, 0.15)'
      }}
    >
      <SidebarContent className="h-full flex flex-col overflow-y-auto overflow-x-hidden py-4 px-2"
        style={{
          maxHeight: 'calc(100vh - 3.5rem - 2rem)',
          paddingTop: '1rem',
          paddingBottom: '1rem'
        }}
      >
        {/* ELITE LEAGUE TITLE */}
        {open && (
          <div className="px-2 pb-3 border-b border-sidebar-border/50 mb-3 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 glass-button rounded-lg flex items-center justify-center group-hover:scale-110 transition-all flex-shrink-0 animate-neon-pulse">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-base font-bold font-rajdhani text-foreground tracking-wider group-hover:text-primary transition-colors truncate neon-glow">
                ELITE LEAGUE
              </h1>
            </Link>
          </div>
        )}

        <SidebarGroup className="flex-1 min-h-0 overflow-y-auto">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-primary transition-all duration-200 group backdrop-blur-sm animate-hover-lift border border-transparent hover:border-primary/30"
                      activeClassName="glass-button text-primary font-semibold shadow-sm border-primary/50 neon-glow"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
                      {open && (
                        <span className="font-rajdhani text-sm tracking-wide transition-opacity duration-300 truncate">
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto border-t border-sidebar-border/50 pt-3 pb-2 flex-shrink-0">
          {open && (
            <SidebarGroupLabel className="px-2.5 text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
              Settings
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-primary transition-all duration-200 group backdrop-blur-sm animate-hover-lift border border-transparent hover:border-primary/30"
                      activeClassName="glass-button text-primary font-semibold shadow-sm border-primary/50 neon-glow"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
                      {open && (
                        <span className="font-rajdhani text-sm tracking-wide transition-opacity duration-300 truncate">
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
