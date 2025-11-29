import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Brain, Zap, Layers, Activity, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PerformanceMetrics {
  avgThinkTime: number;
  cacheHitRate: number;
  lightweightRate: number;
  depthDistribution: { depth: number; count: number }[];
  powerHistory: { power: number; level: number; timestamp: number }[];
}

interface MasterPerformanceDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: PerformanceMetrics;
}

export const MasterPerformanceDashboard = ({ open, onOpenChange, metrics }: MasterPerformanceDashboardProps) => {
  // Calculate max count for depth distribution
  const maxDepthCount = Math.max(...metrics.depthDistribution.map(d => d.count), 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[rgba(20,20,25,0.95)] border-2 border-green-500/40 shadow-[0_8px_32px_rgba(34,197,94,0.3)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-rajdhani text-green-400 flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Master AI Diagnostics
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Average Think Time */}
            <Card className="p-4 bg-background/40 border-green-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="h-5 w-5 text-green-400" />
                <h3 className="text-sm font-semibold text-muted-foreground">Avg Think Time</h3>
              </div>
              <p className="text-3xl font-bold font-rajdhani text-green-400">
                {metrics.avgThinkTime.toFixed(0)}ms
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">Last 20 moves</p>
            </Card>

            {/* Cache Hit Rate */}
            <Card className="p-4 bg-background/40 border-green-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="h-5 w-5 text-green-400" />
                <h3 className="text-sm font-semibold text-muted-foreground">Cache Hit Rate</h3>
              </div>
              <p className="text-3xl font-bold font-rajdhani text-green-400">
                {metrics.cacheHitRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">Instant moves</p>
            </Card>
          </div>

          {/* Evaluation Mode Distribution */}
          <Card className="p-4 bg-background/40 border-green-500/30">
            <div className="flex items-center gap-3 mb-3">
              <Layers className="h-5 w-5 text-green-400" />
              <h3 className="text-sm font-semibold text-muted-foreground">Evaluation Mode</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">Lightweight (Power &lt; 40)</span>
                  <span className="font-bold text-green-400">{metrics.lightweightRate.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.lightweightRate} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">Full Evaluation</span>
                  <span className="font-bold text-green-400">{(100 - metrics.lightweightRate).toFixed(1)}%</span>
                </div>
                <Progress value={100 - metrics.lightweightRate} className="h-2" />
              </div>
            </div>
          </Card>

          {/* Depth Distribution Chart */}
          <Card className="p-4 bg-background/40 border-green-500/30">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <h3 className="text-sm font-semibold text-muted-foreground">Search Depth Distribution</h3>
            </div>
            <div className="space-y-2">
              {metrics.depthDistribution.length > 0 ? (
                metrics.depthDistribution.map(({ depth, count }) => (
                  <div key={depth} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-16">Depth {depth}</span>
                    <div className="flex-1 relative h-6 bg-background/50 rounded overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500/60 to-green-400/60 transition-all duration-300"
                        style={{ width: `${(count / maxDepthCount) * 100}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {count} moves
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground/60 text-center py-4">
                  No moves recorded yet
                </p>
              )}
            </div>
          </Card>

          {/* Power + Level Scaling Timeline */}
          <Card className="p-4 bg-background/40 border-green-500/30">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="h-5 w-5 text-green-400" />
              <h3 className="text-sm font-semibold text-muted-foreground">Power + Level History</h3>
            </div>
            <div className="space-y-2">
              {metrics.powerHistory.length > 0 ? (
                metrics.powerHistory.slice(-5).reverse().map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-background/30 rounded border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground/70">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-green-400">
                          Power {entry.power}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-sm font-semibold text-green-400">
                          Level {entry.level}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground/60">
                      Depth: {Math.floor(entry.power / 5) + Math.floor(entry.level / 4) + 2}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground/60 text-center py-4">
                  No history available yet
                </p>
              )}
            </div>
          </Card>

          {/* Performance Insights */}
          <Card className="p-4 bg-green-500/10 border-2 border-green-500/30">
            <h3 className="text-sm font-semibold text-green-400 mb-2">💡 Performance Insights</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground/80">
              <li>• Cache hits reduce move calculation time to near-instant</li>
              <li>• Lightweight mode (Power &lt; 40) uses quick heuristics instead of deep search</li>
              <li>• Higher depth = stronger moves but longer think time</li>
              <li>• Master level adds {Math.floor(metrics.powerHistory[0]?.level || 1 / 4)} bonus depth automatically</li>
            </ul>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
