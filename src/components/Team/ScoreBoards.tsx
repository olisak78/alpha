import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Medal, Flame } from "lucide-react";
import type { Member as DutyMember } from "@/hooks/useOnDutyData";

interface ScoreBoardsProps {
  jiraTop3: Array<{ id: string; count: number; member: DutyMember }>;
  gitTop3: Array<{ id: string; lines: number; member: DutyMember }>;
  dutyTop3: Array<{ id: string; days: number; member: DutyMember }>;
  crossTeamRows: Array<{
    team: string;
    overall: number;
    dora: number;
    runs: number;
    quality: number;
    availability: string;
    alerts: number;
    size: number;
  }>;
  scoreWeights: { dora: number; runs: number; quality: number; availability: number; alerts: number };
}

const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");

export function ScoreBoards({ 
  jiraTop3, 
  gitTop3, 
  dutyTop3, 
  crossTeamRows, 
  scoreWeights 
}: ScoreBoardsProps) {
  return (
    <>
      {/* Team Scoreboards */}
      <section className="mt-2 animate-enter" aria-labelledby="team-scoreboards">
        <h2 id="team-scoreboards" className="text-lg font-semibold mb-3">Team Scoreboards</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Jira Resolved */}
          <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
            <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-primary/20 blur-2xl"></div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="h-4 w-4 text-primary" /> Most Issues Resolved
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {jiraTop3.length ? jiraTop3.map((row, idx) => {
                const max = jiraTop3[0].count || 1;
                const pct = Math.round((row.count / max) * 100);
                const rankBg = idx === 0 ? "bg-success/10 text-success" : idx === 1 ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary";
                const barColor = idx === 0 ? "bg-success" : idx === 1 ? "bg-warning" : "bg-primary";
                return (
                  <div key={row.id} className="rounded-md p-3 bg-background/60 border hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-7 w-7 shrink-0 rounded-full grid place-items-center font-semibold ${rankBg}`}>
                          {idx === 0 ? <Crown className="h-4 w-4 text-warning" /> : (idx + 1)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={row.member?.avatar || undefined} alt={`${row.member?.fullName || row.id} avatar`} />
                            <AvatarFallback>{(row.member?.fullName || row.id).split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium leading-none">{row.member?.fullName || row.id}</div>
                            <div className="text-xs text-muted-foreground">{row.count} issues</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : (<div className="text-sm text-muted-foreground">No resolved issues yet</div>)}
            </CardContent>
          </Card>

          {/* GitHub Lines */}
          <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
            <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-primary/20 blur-2xl"></div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="h-4 w-4 text-primary" /> Most Code Lines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gitTop3.length ? gitTop3.map((row, idx) => {
                const max = gitTop3[0].lines || 1;
                const pct = Math.round((row.lines / max) * 100);
                const k = row.lines >= 1000 ? `${(row.lines/1000).toFixed(1)}k` : `${row.lines}`;
                const rankBg = idx === 0 ? "bg-success/10 text-success" : idx === 1 ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary";
                const barColor = idx === 0 ? "bg-success" : idx === 1 ? "bg-warning" : "bg-primary";
                return (
                  <div key={row.id} className="rounded-md p-3 bg-background/60 border hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-7 w-7 shrink-0 rounded-full grid place-items-center font-semibold ${rankBg}`}>
                          {idx === 0 ? <Crown className="h-4 w-4 text-warning" /> : (idx + 1)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={row.member?.avatar || undefined} alt={`${row.member?.fullName || row.id} avatar`} />
                            <AvatarFallback>{(row.member?.fullName || row.id).split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium leading-none">{row.member?.fullName || row.id}</div>
                            <div className="text-xs text-muted-foreground">{k} lines</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : (<div className="text-sm text-muted-foreground">No GitHub data</div>)}
            </CardContent>
          </Card>

          {/* Duty + On Call Days */}
          <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
            <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-primary/20 blur-2xl"></div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Medal className="h-4 w-4 text-primary" /> Most Duty + On Call Days
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dutyTop3.length ? dutyTop3.map((row, idx) => {
                const max = dutyTop3[0].days || 1;
                const pct = Math.round((row.days / max) * 100);
                const rankBg = idx === 0 ? "bg-success/10 text-success" : idx === 1 ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary";
                const barColor = idx === 0 ? "bg-success" : idx === 1 ? "bg-warning" : "bg-primary";
                return (
                  <div key={row.id} className="rounded-md p-3 bg-background/60 border hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-7 w-7 shrink-0 rounded-full grid place-items-center font-semibold ${rankBg}`}>
                          {idx === 0 ? <Crown className="h-4 w-4 text-warning" /> : (idx + 1)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={row.member?.avatar || undefined} alt={`${row.member?.fullName || row.id} avatar`} />
                            <AvatarFallback>{(row.member?.fullName || row.id).split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium leading-none">{row.member?.fullName || row.id}</div>
                            <div className="text-xs text-muted-foreground">{row.days} days</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : (<div className="text-sm text-muted-foreground">No duty data</div>)}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cross-Team Scoreboard */}
      <section className="mt-6" aria-labelledby="cross-team-scoreboard">
        <h2 id="cross-team-scoreboard" className="text-lg font-semibold mb-3">Cross-Team Scoreboard</h2>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Rank</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="min-w-[180px]">Overall*</TableHead>
                <TableHead className="min-w-[140px]">DORA ({scoreWeights.dora}%)</TableHead>
                <TableHead>CI/CD Runs ({scoreWeights.runs}%)</TableHead>
                <TableHead className="min-w-[140px]">Quality ({scoreWeights.quality}%)</TableHead>
                <TableHead>Availability YTD ({scoreWeights.availability}%)</TableHead>
                <TableHead>Alerts ({scoreWeights.alerts}%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crossTeamRows.map((row, idx) => {
                const rankBg = idx === 0 ? "bg-success/10 text-success" : idx === 1 ? "bg-warning/10 text-warning" : idx === 2 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground";
                const rowBg = idx === 0 ? "bg-success/5" : idx === 1 ? "bg-warning/5" : idx === 2 ? "bg-primary/5" : "";
                return (
                  <TableRow key={row.team} className={rowBg}>
                    <TableCell>
                      <div className={`h-7 w-7 rounded-full grid place-items-center font-semibold ${rankBg}`}>
                        {idx === 0 ? <Crown className="h-4 w-4 text-warning" /> : (idx + 1)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">Team {row.team}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{row.overall}%</div>
                      <div className="mt-1 h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${row.overall}%` }} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{row.dora}</div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${row.dora}%` }} />
                      </div>
                    </TableCell>
                    <TableCell>{row.runs}</TableCell>
                    <TableCell>
                      <div className="text-sm">{row.quality}</div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${row.quality}%` }} />
                      </div>
                    </TableCell>
                    <TableCell>{row.availability}%</TableCell>
                    <TableCell>{row.alerts}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          * Overall score normalized by team size. Weights — DORA: {scoreWeights.dora}%, CI/CD Runs: {scoreWeights.runs}%, Quality: {scoreWeights.quality}%, Availability: {scoreWeights.availability}%, Alerts: {scoreWeights.alerts}%.
        </p>
      </section>
    </>
  );
}
