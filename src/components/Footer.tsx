import { MessageCircle, Send, Twitter, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useTheme } from "next-themes";

export const Footer = () => {
  const [practiceMode, setPracticeMode] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2.5 text-xs">
          {/* LEFT SIDE */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">STATUS:</span>
              <span className="text-primary font-semibold">LIVE</span>
            </div>
            <button className="text-muted-foreground hover:text-primary transition-colors font-medium hidden md:inline">
              TERMS OF SERVICE
            </button>
            <button className="text-muted-foreground hover:text-primary transition-colors font-medium hidden md:inline">
              PRIVACY POLICY
            </button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary">
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary">
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2 hidden md:flex">
                <span className="text-muted-foreground font-medium">SOL</span>
                <span className="font-semibold">$183.24</span>
              </div>
              <div className="flex items-center gap-2 hidden lg:flex">
                <span className="text-muted-foreground font-medium">GAS:</span>
                <span className="font-semibold">0.01 gwei</span>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-primary hidden sm:inline-flex">
              SUPPORT
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 hover:text-primary" 
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium hidden sm:inline">Practice Mode</span>
              <Switch checked={practiceMode} onCheckedChange={setPracticeMode} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
