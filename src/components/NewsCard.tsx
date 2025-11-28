import { Calendar } from "lucide-react";

interface NewsCardProps {
  title: string;
  description: string;
  date: string;
  category: string;
}

export const NewsCard = ({ title, description, date, category }: NewsCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all cursor-pointer group">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
          {category}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{date}</span>
        </div>
      </div>
      
      <h3 className="text-xl font-bold font-rajdhani mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground line-clamp-2">
        {description}
      </p>
      
      <button className="mt-4 text-sm text-primary hover:text-primary/80 font-semibold">
        Read More →
      </button>
    </div>
  );
};
