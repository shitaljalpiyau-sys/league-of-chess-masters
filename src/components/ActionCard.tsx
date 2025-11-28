import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  icon: LucideIcon;
}

export const ActionCard = ({ title, description, buttonText, icon: Icon }: ActionCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-bold font-rajdhani">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <Button 
        variant="outline" 
        size="sm"
        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-rajdhani font-semibold"
      >
        {buttonText}
      </Button>
    </div>
  );
};
