import { useParams, Link } from "react-router-dom";
import { Calendar, Users, Trophy, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TournamentDetails = () => {
  const { id } = useParams();

  const tournament = {
    id,
    title: "ELITE CHAMPIONSHIP 2024",
    description: "Join the most prestigious tournament of the year. Compete against top players worldwide for glory and exclusive rewards.",
    prize: "50,000 $POINT",
    participants: 128,
    maxParticipants: 256,
    startDate: "2024-12-15",
    timeControl: "10+5",
    format: "Swiss System",
    rounds: 9,
    status: "Upcoming",
    entryFee: "500 $POINT",
    requirements: "Rating: 1500+"
  };

  const leaderboard = [
    { rank: 1, name: "ChessMaster99", rating: 2450, points: 8.5 },
    { rank: 2, name: "KnightRider", rating: 2380, points: 8.0 },
    { rank: 3, name: "QueenGambit", rating: 2420, points: 7.5 },
    { rank: 4, name: "RookRuler", rating: 2350, points: 7.0 },
    { rank: 5, name: "BishopBlitz", rating: 2310, points: 6.5 },
  ];

  const schedule = [
    { round: 1, date: "Dec 15, 10:00 AM", status: "Completed" },
    { round: 2, date: "Dec 15, 2:00 PM", status: "Completed" },
    { round: 3, date: "Dec 16, 10:00 AM", status: "In Progress" },
    { round: 4, date: "Dec 16, 2:00 PM", status: "Upcoming" },
    { round: 5, date: "Dec 17, 10:00 AM", status: "Upcoming" },
  ];

  return (
    <div className="min-h-screen pb-20 pt-20 px-6">
      <div className="max-w-7xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tournaments
          </Button>
        </Link>

        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-border rounded-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold font-rajdhani text-primary mb-2">
                {tournament.title}
              </h1>
              <p className="text-muted-foreground">{tournament.description}</p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              REGISTER NOW
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 bg-card-dark p-4 rounded-lg">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Prize Pool</p>
                <p className="text-lg font-bold">{tournament.prize}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card-dark p-4 rounded-lg">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Players</p>
                <p className="text-lg font-bold">{tournament.participants}/{tournament.maxParticipants}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card-dark p-4 rounded-lg">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-lg font-bold">Dec 15</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card-dark p-4 rounded-lg">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Time Control</p>
                <p className="text-lg font-bold">{tournament.timeControl}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold font-rajdhani mb-4">Tournament Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format:</span>
                    <span className="font-semibold">{tournament.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rounds:</span>
                    <span className="font-semibold">{tournament.rounds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Fee:</span>
                    <span className="font-semibold">{tournament.entryFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requirements:</span>
                    <span className="font-semibold">{tournament.requirements}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-semibold text-primary">{tournament.status}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold font-rajdhani mb-4">Prize Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-card-darker rounded">
                    <span className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      1st Place
                    </span>
                    <span className="font-bold text-primary">20,000 $POINT</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-card-darker rounded">
                    <span className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-gray-400" />
                      2nd Place
                    </span>
                    <span className="font-bold">15,000 $POINT</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-card-darker rounded">
                    <span className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-600" />
                      3rd Place
                    </span>
                    <span className="font-bold">10,000 $POINT</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-card-darker rounded">
                    <span>4th-10th Place</span>
                    <span className="font-bold">5,000 $POINT</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card-dark">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Player</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Rating</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((player) => (
                      <tr key={player.rank} className="border-t border-border hover:bg-card-darker">
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-primary">#{player.rank}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold">{player.name}</td>
                        <td className="px-6 py-4">{player.rating}</td>
                        <td className="px-6 py-4 font-bold">{player.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-xl font-bold font-rajdhani mb-4">Tournament Schedule</h3>
              <div className="space-y-3">
                {schedule.map((round) => (
                  <div
                    key={round.round}
                    className="flex items-center justify-between p-4 bg-card-darker rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-primary">R{round.round}</span>
                      <div>
                        <p className="font-semibold">Round {round.round}</p>
                        <p className="text-sm text-muted-foreground">{round.date}</p>
                      </div>
                    </div>
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                        round.status === "Completed"
                          ? "bg-green-500/20 text-green-500"
                          : round.status === "In Progress"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {round.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TournamentDetails;
