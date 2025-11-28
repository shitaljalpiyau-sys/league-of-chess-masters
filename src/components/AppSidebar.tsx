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
  { title: "SOCIAL", url: "/social", icon: MessageSquare },
  { title: "MARKETPLACE", url: "/marketplace", icon: ShoppingCart },
  { title: "INVENTORY", url: "/inventory", icon: Package },
  { title: "PROFILE", url: "/profile", icon: Users },
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
      className="border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl transition-all duration-300 ease-in-out"
      style={{ 
        position: 'fixed',
        top: '4rem',
        bottom: 0,
        left: 0,
        height: 'calc(100vh - 4rem)',
        width: open ? 'clamp(220px, 20vw, 260px)' : '4rem',
        minWidth: open ? '220px' : '4rem',
        zIndex: 40,
        background: 'rgba(16, 20, 28, 0.95)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(61, 201, 119, 0.15)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
      }}
    >
      <SidebarContent className="h-full flex flex-col overflow-y-auto overflow-x-hidden py-4 px-3"
        style={{
          maxHeight: 'calc(100vh - 4rem - 2rem)',
          paddingTop: '1.5rem',
          paddingBottom: '1rem'
        }}
      >

        <SidebarGroup className="flex-1 min-h-0 overflow-y-auto">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-card-dark hover:text-foreground transition-all duration-200 group"
                      activeClassName="bg-primary/10 text-primary border-l-2 border-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 transition-all duration-200" />
                      {open && (
                        <span className="text-sm font-medium transition-opacity duration-300 truncate">
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
            <SidebarGroupLabel className="px-3 text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
              Settings
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-card-dark hover:text-foreground transition-all duration-200 group"
                      activeClassName="bg-primary/10 text-primary border-l-2 border-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 transition-all duration-200" />
                      {open && (
                        <span className="text-sm font-medium transition-opacity duration-300 truncate">
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
