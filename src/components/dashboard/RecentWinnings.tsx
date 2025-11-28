import { Card } from "@/components/ui/card";
import { Coins, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const RecentWinnings = () => {
  const winnings = [
    {
      id: 1,
      tournament: "Grand Master Championship",
      prize: "$2,500",
      position: "1st Place",
      date: "2 hours ago",
      color: "from-[hsl(var(--premium-gold))]/30 to-amber-500/30",
    },
    {
      id: 2,
      tournament: "Speed Blitz Arena",
      prize: "$1,200",
      position: "2nd Place",
      date: "5 hours ago",
      color: "from-slate-400/30 to-slate-500/30",
    },
    {
      id: 3,
      tournament: "Rapid Masters Cup",
      prize: "$800",
      position: "3rd Place",
      date: "1 day ago",
      color: "from-amber-700/30 to-amber-800/30",
    },
    {
      id: 4,
      tournament: "Elite Weekly Showdown",
      prize: "$500",
      position: "5th Place",
      date: "2 days ago",
      color: "from-primary/20 to-accent/20",
    },
  ];

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Coins className="w-8 h-8 text-[hsl(var(--premium-gold))]" />
            RECENT WINNINGS
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Latest tournament victories and prizes</p>
        </div>
        <Button variant="ghost" className="text-primary font-bold">
          View All →
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {winnings.map((win) => (
          <Card
            key={win.id}
            className={`glass-panel border-2 border-border hover:border-primary/50 p-5 transition-all duration-300 hover:scale-105 cursor-pointer bg-gradient-to-br ${win.color}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-black text-foreground text-lg mb-1">{win.tournament}</h3>
                <p className="text-sm text-muted-foreground">{win.date}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-[hsl(var(--premium-gold))] mb-1">{win.prize}</div>
                <div className="flex items-center gap-1 text-green-500 text-sm font-bold">
                  <TrendingUp className="w-4 h-4" />
                  {win.position}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-border">
              <Button size="sm" variant="outline" className="w-full font-bold">
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
