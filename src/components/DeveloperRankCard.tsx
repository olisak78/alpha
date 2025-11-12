import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface DeveloperRankProps {
  rank: number;
  score: number;
  distanceToFirst: number;
}

export default function DeveloperRankCard({ rank, score, distanceToFirst }: DeveloperRankProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Rank (Team)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <div className="text-sm">Rank</div>
          </div>
          <div className="text-lg font-semibold">#{rank}</div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">Score: {score.toFixed(1)} / 100</div>
        <div className="mt-1 text-xs text-muted-foreground">Distance to #1: {distanceToFirst.toFixed(1)} pts</div>
      </CardContent>
    </Card>
  );
}
