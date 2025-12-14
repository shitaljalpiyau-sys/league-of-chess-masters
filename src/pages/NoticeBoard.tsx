import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Trophy, Users, Clock, Award } from "lucide-react";
import { GAME_CLASSES, PROMOTION_SLOTS } from "@/config/pointsEconomy";

const NoticeBoard = () => {
  const classIcons = {
    ELITE: Trophy,
    A: Award,
    B: Users,
    C: TrendingUp,
    D: Clock,
  };

  const classes = GAME_CLASSES.map(gc => ({
    ...gc,
    icon: classIcons[gc.id as keyof typeof classIcons] || Clock,
  }));

  const rankingSystem = [
    {
      title: "CLASS C vs CLASS D",
      up: "Top Class D players get promoted to Class C",
      down: "Weak Class C players drop to Class D",
      icon: TrendingUp
    },
    {
      title: "CLASS B vs CLASS C",
      up: "Best Class C players get promoted to Class B",
      down: "Lowest Class B players drop to Class C",
      icon: TrendingUp
    },
    {
      title: "CLASS A vs CLASS B",
      up: "Top Class B players get promoted to Class A",
      down: "Lowest Class A players drop to Class B",
      icon: TrendingUp
    },
    {
      title: "ELITE CLASS vs CLASS A",
      up: "Top 5 performers from Class A get promoted to Elite",
      down: "Only 5 players can stay in Elite",
      icon: Trophy
    }
  ];

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            NOTICE BOARD
          </h1>
          <p className="text-xl text-muted-foreground">
            Point System & Class Structure
          </p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Game Classes (Total 5)
            </CardTitle>
            <CardDescription>
              Progress through the ranks and earn more points
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {classes.map((classInfo, index) => (
              <Card key={index} className="border overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${classInfo.color}`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <classInfo.icon className="h-6 w-6" />
                        <CardTitle className="text-xl">{classInfo.name}</CardTitle>
                        <Badge variant="outline">{classInfo.tier}</Badge>
                      </div>
                      <CardDescription className="text-base">
                        {classInfo.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Limit</div>
                      <div className="font-semibold">{classInfo.limitDisplay}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Earnings</div>
                      <div className="font-semibold">{classInfo.earnings}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Hourly Rate</div>
                      <div className="font-semibold text-primary">
                        ~{classInfo.hourlyRate} points/hour
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Weekly Rank Upgrade System
            </CardTitle>
            <CardDescription>
              Promotions and demotions happen every week based on performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rankingSystem.map((rank, index) => (
              <Card key={index} className="border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <rank.icon className="h-5 w-5" />
                    {rank.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-green-600 dark:text-green-400">Promotion:</span>{" "}
                      {rank.up}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-red-600 dark:text-red-400">Demotion:</span>{" "}
                      {rank.down}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card className="border-2 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-xl">Purpose of This Notice Board</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Explains all class levels and their benefits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Shows point earnings per class</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Shows class limits and player capacity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Explains weekly promotion and demotion rules</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Helps players understand game progression system</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NoticeBoard;