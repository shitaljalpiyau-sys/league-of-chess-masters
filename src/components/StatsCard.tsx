import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  isPositive?: boolean;
}

export const StatsCard = ({ label, value, change, icon: Icon, isPositive = true }: StatsCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`p-2 rounded-lg ${isPositive ? 'bg-primary/10' : 'bg-destructive/10'}`}>
          <Icon className={`h-5 w-5 ${isPositive ? 'text-primary' : 'text-destructive'}`} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-bold font-rajdhani">{value}</h3>
        <span className={`text-sm font-semibold ${isPositive ? 'text-primary' : 'text-destructive'}`}>
          {change}
        </span>
      </div>
    </div>
  );
};
