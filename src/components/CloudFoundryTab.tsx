import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Globe,
  History,
  Logs,
  Play,
  Power,
  RefreshCcw,
  Server,
  SlidersHorizontal,
  StopCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// Types
interface InstanceRow {
  id: string;
  state: "running" | "stopped";
  since: string; // ISO
  cpuPct: number;
  memUsedMb: number;
  memQuotaMb: number;
  diskUsedMb: number;
  diskQuotaMb: number;
  logRateKb: number;
  entitlementPct: number;
}

interface Props {
  componentId: string | null;
  landscapeId?: string | null;
}

// Utilities
const bytesToMb = (mb: number) => `${mb} MB`;
const pct = (n: number) => `${n.toFixed(1)}%`;
const formatSince = (iso: string) => {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

function generateMockInstances(count: number): InstanceRow[] {
  return Array.from({ length: count }).map((_, i) => {
    const running = Math.random() > 0.1;
    const memQuota = [256, 512, 1024][Math.floor(Math.random() * 3)];
    const diskQuota = [1024, 2048, 4096][Math.floor(Math.random() * 3)];
    const memUsed = Math.floor((0.2 + Math.random() * 0.7) * memQuota);
    const diskUsed = Math.floor((0.1 + Math.random() * 0.6) * diskQuota);
    return {
      id: `inst-${i + 1}`,
      state: running ? "running" : "stopped",
      since: new Date(Date.now() - Math.floor(Math.random() * 72) * 3600000).toISOString(),
      cpuPct: running ? Math.random() * 80 : 0,
      memUsedMb: memUsed,
      memQuotaMb: memQuota,
      diskUsedMb: diskUsed,
      diskQuotaMb: diskQuota,
      logRateKb: running ? Math.random() * 50 : 0,
      entitlementPct: running ? 50 + Math.random() * 50 : 0,
    };
  });
}

// Sensitive masking
const isSensitive = (key: string) => /pass|secret|key|token|pwd/i.test(key);

export default function CloudFoundryTab({ componentId, landscapeId }: Props) {
  const [instances, setInstances] = useState<InstanceRow[]>(() => generateMockInstances(6));
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof InstanceRow>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Actions state
  const [showRestage, setShowRestage] = useState(false);
  const [restageFlags, setRestageFlags] = useState({
    noRoute: false,
    noStart: false,
    strategy: "rolling" as "rolling" | "blue-green",
  });

  const [showScale, setShowScale] = useState(false);
  const [scale, setScale] = useState({ instances: 6, memoryMb: 512, diskMb: 2048 });

  const [showLogs, setShowLogs] = useState(false);
  const [logQuery, setLogQuery] = useState("");
  const [logRegex, setLogRegex] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const generateMockLogs = (n: number) => {
    const levels = ["INFO", "WARN", "ERROR"];
    const messages = [
      "App starting...",
      "Binding services...",
      "Slow query detected",
      "Failed to connect to external API",
      "Instance healthy",
      "Cache miss for key",
      "User authenticated",
      "Background job completed",
    ];
    const arr: string[] = [];
    for (let i = 0; i < n; i++) {
      const lvl = levels[Math.floor(Math.random() * levels.length)];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const ts = new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString();
      arr.push(`[${lvl}] ${ts} ${msg}`);
    }
    return arr;
  };

  useEffect(() => {
    if (showLogs) {
      setLogs(generateMockLogs(300));
      setMatchIndex(0);
    }
  }, [showLogs]);
  const filteredLogs = useMemo(() => {
    if (!logs.length) return logs;
    const q = logQuery.trim();
    try {
      if (q) {
        if (logRegex) {
          const re = new RegExp(q.replace(/^\/~|~\/$/g, ""), "i");
          return logs.filter((l) => re.test(l));
        }
        return logs.filter((l) => l.toLowerCase().includes(q.toLowerCase()));
      }
      return logs;
    } catch {
      return logs;
    }
  }, [logs, logQuery, logRegex]);

  const renderLogLine = (line: string) => {
    const isError = /\[ERROR\]/i.test(line);
    const isWarn = /\[WARN\]/i.test(line);
    const base = "whitespace-pre-wrap";
    const cls = isError ? "text-destructive font-semibold" : isWarn ? "opacity-90" : "";
    if (!logQuery.trim()) return <span className={`${base} ${cls}`}>{line}</span>;
    try {
      if (logRegex) {
        const re = new RegExp(logQuery.replace(/^\/~|~\/$/g, ""), "gi");
        const parts: React.ReactNode[] = [];
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(line)) !== null) {
          if (m.index > last) parts.push(line.slice(last, m.index));
          parts.push(<mark key={m.index} className="bg-primary/20 rounded px-0.5">{m[0]}</mark>);
          last = m.index + m[0].length;
        }
        parts.push(line.slice(last));
        return <span className={`${base} ${cls}`}>{parts}</span>;
      } else {
        const q = logQuery;
        const lower = line.toLowerCase();
        const ql = q.toLowerCase();
        const parts: React.ReactNode[] = [];
        let start = 0;
        let idx;
        while ((idx = lower.indexOf(ql, start)) !== -1) {
          if (idx > start) parts.push(line.slice(start, idx));
          parts.push(<mark key={idx} className="bg-primary/20 rounded px-0.5">{line.slice(idx, idx + q.length)}</mark>);
          start = idx + q.length;
        }
        parts.push(line.slice(start));
        return <span className={`${base} ${cls}`}>{parts}</span>;
      }
    } catch {
      return <span className={`${base} ${cls}`}>{line}</span>;
    }
  };

  const goToMatch = (dir: -1 | 1) => {
    setMatchIndex((prev) => {
      const len = filteredLogs.length;
      if (!len) return 0;
      const next = (prev + dir + len) % len;
      requestAnimationFrame(() => {
        const el = document.getElementById(`log-line-${next}`);
        el?.scrollIntoView({ block: "center" });
      });
      return next;
    });
  };

  // Error analysis state
  const [analysisLogs, setAnalysisLogs] = useState<string[]>(() => generateMockLogs(500));
  const analysis = useMemo(() => analyzeLogs(analysisLogs), [analysisLogs]);
  function analyzeLogs(lines: string[]) {
    let errors = 0, warns = 0;
    const topMap = new Map<string, number>();
    const recentErrors: { ts: string; message: string }[] = [];
    const re = /^\[(\w+)\]\s+([^\s]+)\s+(.*)$/;
    for (const ln of lines) {
      const m = re.exec(ln);
      if (!m) continue;
      const level = m[1].toUpperCase();
      const ts = m[2];
      const msg = m[3];
      if (level === "ERROR") {
        errors++;
        recentErrors.push({ ts, message: msg });
        topMap.set(msg, (topMap.get(msg) || 0) + 1);
      } else if (level === "WARN") {
        warns++;
      }
    }
    recentErrors.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    const topErrors = Array.from(topMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));
    const total = lines.length;
    const errorRate = total ? Math.round((errors / total) * 1000) / 10 : 0;
    const lastErrorTs = recentErrors[0]?.ts || null;
    const events = recentErrors.slice(0, 6).map((e, i) => ({
      ts: e.ts,
      type: i % 2 ? "app.crash" : "log.error",
      message: e.message,
    }));
    return { total, errors, warns, errorRate, lastErrorTs, topErrors, events, recentErrors: recentErrors.slice(0, 20) };
  }

  const routes = useMemo(
    () => [
      { url: `${componentId}.apps.example.com`, domain: "apps.example.com", port: 443, tls: true },
      { url: `${componentId}.internal.example`, domain: "internal.example", port: 8080, tls: false },
    ],
    [componentId]
  );

  const envSystem = {
    VCAP_APPLICATION: {
      application_name: componentId,
      instance_index: 0,
      space_name: landscapeId || "staging",
    },
    VCAP_SERVICES: {
      postgres: [{ name: "pg-main", plan: "standard", credentials: { uri: "postgres://user:****@host/db" } }],
    },
  };
  const envUser = { FEATURE_FLAG: "true", RETRY_COUNT: 3 };
  const envCustom = { API_KEY: "****", SECRET_TOKEN: "****" };

  const filteredSorted = useMemo(() => {
    const q = search.toLowerCase();
    const rows = instances.filter(
      (r) => r.id.toLowerCase().includes(q) || r.state.toLowerCase().includes(q)
    );
    rows.sort((a, b) => {
      const A = a[sortKey] as any;
      const B = b[sortKey] as any;
      const res = A > B ? 1 : A < B ? -1 : 0;
      return sortDir === "asc" ? res : -res;
    });
    return rows;
  }, [instances, search, sortKey, sortDir]);

  const total = filteredSorted.length;
  const totalRunning = filteredSorted.filter((i) => i.state === "running").length;
  const pageRows = filteredSorted.slice((page - 1) * pageSize, page * pageSize);
  const avgStats = useMemo(() => {
    const list = filteredSorted;
    const n = list.length;
    if (!n)
      return {
        avgCpu: 0,
        avgLogRate: 0,
        avgEntitlement: 0,
        memPct: 0,
        diskPct: 0,
        memUsedMb: 0,
        memQuotaMb: 0,
        diskUsedMb: 0,
        diskQuotaMb: 0,
      };
    const sums = list.reduce(
      (acc, r) => {
        acc.cpu += r.cpuPct;
        acc.memUsed += r.memUsedMb;
        acc.memQuota += r.memQuotaMb;
        acc.diskUsed += r.diskUsedMb;
        acc.diskQuota += r.diskQuotaMb;
        acc.logRate += r.logRateKb;
        acc.entitlement += r.entitlementPct;
        return acc;
      },
      { cpu: 0, memUsed: 0, memQuota: 0, diskUsed: 0, diskQuota: 0, logRate: 0, entitlement: 0 }
    );
    const avgCpu = sums.cpu / n;
    const avgLogRate = sums.logRate / n;
    const avgEntitlement = sums.entitlement / n;
    const memPct = sums.memQuota ? (sums.memUsed / sums.memQuota) * 100 : 0;
    const diskPct = sums.diskQuota ? (sums.diskUsed / sums.diskQuota) * 100 : 0;
    const memUsedMb = sums.memUsed / n;
    const memQuotaMb = sums.memQuota / n;
    const diskUsedMb = sums.diskUsed / n;
    const diskQuotaMb = sums.diskQuota / n;
    return { avgCpu, avgLogRate, avgEntitlement, memPct, diskPct, memUsedMb, memQuotaMb, diskUsedMb, diskQuotaMb };
  }, [filteredSorted]);

  const onSort = (k: keyof InstanceRow) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Server className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Cloud Foundry</h2>
          <Badge variant="outline">{componentId}</Badge>
          {landscapeId && <Badge variant="secondary">{landscapeId}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setInstances(generateMockInstances(scale.instances))}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Dialog open={showLogs} onOpenChange={setShowLogs}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Logs className="h-4 w-4 mr-2" /> View Logs
              </Button>
            </DialogTrigger>
              <DialogContent className="max-w-6xl w-[90vw]">
                <DialogHeader>
                  <DialogTitle>Recent Logs</DialogTitle>
                  <DialogDescription>Fetched on open. Use search or regex to filter.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Input placeholder="Search or /regex/" value={logQuery} onChange={(e) => setLogQuery(e.target.value)} />
                  <Label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={logRegex} onChange={(e) => setLogRegex(e.target.checked)} />
                    Regex
                  </Label>
                  <Button variant="outline" size="sm" onClick={() => setLogs(generateMockLogs(300))}>
                    <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </div>
                <div ref={logContainerRef} className="max-h-[70vh] overflow-auto rounded-md border">
                  <div className="p-4 font-mono text-xs leading-4 space-y-1">
                    {filteredLogs.map((line, i) => (
                      <div id={`log-line-${i}`} key={i}>
                        {renderLogLine(line)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="text-xs text-muted-foreground">Showing {filteredLogs.length} lines. Errors highlighted.</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => goToMatch(-1)}>Prev</Button>
                    <Button variant="outline" size="sm" onClick={() => goToMatch(1)}>Next</Button>
                  </div>
                </div>
              </DialogContent>
          </Dialog>
          <Dialog open={showRestage} onOpenChange={setShowRestage}>
            <DialogTrigger asChild>
              <Button size="sm">
                <History className="h-4 w-4 mr-2" /> Restage
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restage application</DialogTitle>
                <DialogDescription>Review flags before execution.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <Label className="text-sm">--no-route</Label>
                      <div className="text-xs text-muted-foreground">Do not map routes during restage</div>
                    </div>
                    <Switch checked={restageFlags.noRoute} onCheckedChange={(v) => setRestageFlags({ ...restageFlags, noRoute: v })} />
                  </div>
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <Label className="text-sm">--no-start</Label>
                      <div className="text-xs text-muted-foreground">Do not start app after staging completes</div>
                    </div>
                    <Switch checked={restageFlags.noStart} onCheckedChange={(v) => setRestageFlags({ ...restageFlags, noStart: v })} />
                  </div>
                </div>
                <div className="border rounded-md p-3">
                  <Label className="text-xs mb-2 block">Strategy</Label>
                  <RadioGroup value={restageFlags.strategy} onValueChange={(val) => setRestageFlags({ ...restageFlags, strategy: val as any })} className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 border rounded-md p-2">
                      <RadioGroupItem id="strategy-rolling" value="rolling" />
                      <Label htmlFor="strategy-rolling" className="text-sm">Rolling</Label>
                    </div>
                    <div className="flex items-center gap-2 border rounded-md p-2">
                      <RadioGroupItem id="strategy-blue-green" value="blue-green" />
                      <Label htmlFor="strategy-blue-green" className="text-sm">Blue-Green</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="rounded-md border bg-muted p-3 text-xs font-mono">
                  cf restage {componentId} {restageFlags.noRoute ? "--no-route " : ""}{restageFlags.noStart ? "--no-start " : ""}--strategy {restageFlags.strategy}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowRestage(false)}>Cancel</Button>
                  <Button onClick={() => setShowRestage(false)}>Confirm Restage</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Instances</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="scale">Scale</TabsTrigger>
          <TabsTrigger value="env">Environment</TabsTrigger>
          <TabsTrigger value="errors">Error analysis</TabsTrigger>
        </TabsList>

        {/* Application Instance Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Aggregated instance statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" /> Application Instances
                <Badge variant="secondary">{totalRunning}/{total} running</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-3">Averaged across {total} instances</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Avg CPU</div>
                    <div className="text-2xl font-semibold">{avgStats.avgCpu.toFixed(1)}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Avg Memory Utilization</div>
                    <div className="text-2xl font-semibold">{avgStats.memPct.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">{bytesToMb(Math.round(avgStats.memUsedMb))} / {bytesToMb(Math.round(avgStats.memQuotaMb))}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Avg Disk Utilization</div>
                    <div className="text-2xl font-semibold">{avgStats.diskPct.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">{bytesToMb(Math.round(avgStats.diskUsedMb))} / {bytesToMb(Math.round(avgStats.diskQuotaMb))}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Avg Log Rate</div>
                    <div className="text-2xl font-semibold">{avgStats.avgLogRate.toFixed(1)} KB/s</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Avg Entitlement</div>
                    <div className="text-2xl font-semibold">{avgStats.avgEntitlement.toFixed(1)}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Running Instances</div>
                    <div className="text-2xl font-semibold">{totalRunning}/{total}</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* CF Application Summary + Instances table (detailed) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" /> CF Application Summary</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setInstances(generateMockInstances(scale.instances))}><RefreshCcw className="h-4 w-4 mr-2" /> Refresh</Button>
                <Button variant="secondary" size="sm" disabled title="Start from overview actions"><Play className="h-4 w-4 mr-1" /> Start</Button>
                <Button variant="outline" size="sm" disabled title="Stop from overview actions"><Power className="h-4 w-4 mr-1" /> Stop</Button>
                <Button size="sm" disabled title="Restage from overview actions"><History className="h-4 w-4 mr-1" /> Restage</Button>
                <Button variant="outline" size="sm" disabled title="Scale from Scale tab"><SlidersHorizontal className="h-4 w-4 mr-1" /> Scale</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">App:</span> {componentId}</div>
                  <div><span className="text-muted-foreground">GUID:</span> {componentId}</div>
                  <div><span className="text-muted-foreground">Org/Space:</span> example-org / {landscapeId || "staging"}</div>
                  <div><span className="text-muted-foreground">Routes:</span> {routes.map(r => r.url).join(", ")}</div>
                </div>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Buildpack/Stack:</span> java_buildpack / cflinuxfs4</div>
                  <div><span className="text-muted-foreground">Memory/Disk:</span> 512MB / 2GB</div>
                  <div><span className="text-muted-foreground">State:</span> started</div>
                  <div><span className="text-muted-foreground">Uptime:</span> {formatSince(new Date(Date.now() - 6*3600000).toISOString())}</div>
                </div>
              </div>

              {/* Instances table */}
              <div className="rounded-md border overflow-hidden">
                <div className="flex items-center justify-between p-3">
                  <div className="text-sm">Instances <Badge variant="secondary" className="ml-2">{totalRunning}/{total} running</Badge></div>
                  <Input placeholder="Search instances..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => onSort("id")}>ID</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => onSort("state")}>State</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => onSort("since")}>Since</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => onSort("cpuPct")}>CPU</TableHead>
                      <TableHead>Memory</TableHead>
                      <TableHead>Disk</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => onSort("logRateKb")}>Log KB/s</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => onSort("entitlementPct")}>Entitlement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.id}</TableCell>
                        <TableCell>
                          <Badge variant={r.state === "running" ? "secondary" : "outline"}>{r.state}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatSince(r.since)}</TableCell>
                        <TableCell className="text-sm">{pct(r.cpuPct)}</TableCell>
                        <TableCell className="text-sm">{bytesToMb(r.memUsedMb)} / {bytesToMb(r.memQuotaMb)}</TableCell>
                        <TableCell className="text-sm">{bytesToMb(r.diskUsedMb)} / {bytesToMb(r.diskQuotaMb)}</TableCell>
                        <TableCell className="text-sm">{r.logRateKb.toFixed(1)}</TableCell>
                        <TableCell className="text-sm">{pct(r.entitlementPct)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between p-3 text-sm text-muted-foreground">
                  <div>Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                    <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}>Next</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Configuration */}
        <TabsContent value="routes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Routes
                <Badge variant="outline">{routes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Port</TableHead>
                      <TableHead>TLS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map((r) => (
                      <TableRow key={r.url}>
                        <TableCell className="font-mono">{r.url}</TableCell>
                        <TableCell>{r.domain}</TableCell>
                        <TableCell>{r.port}</TableCell>
                        <TableCell>{r.tls ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scaling Controls */}
        <TabsContent value="scale" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" /> Scale application
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs">Instances: {scale.instances}</Label>
                  <Slider value={[scale.instances]} min={1} max={20} step={1} onValueChange={(v) => setScale({ ...scale, instances: v[0] })} />
                  <Input type="number" value={scale.instances} onChange={(e) => setScale({ ...scale, instances: parseInt(e.target.value || "0", 10) })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Memory per instance (MB): {scale.memoryMb}</Label>
                  <Slider value={[scale.memoryMb]} min={256} max={4096} step={256} onValueChange={(v) => setScale({ ...scale, memoryMb: v[0] })} />
                  <Input type="number" value={scale.memoryMb} onChange={(e) => setScale({ ...scale, memoryMb: parseInt(e.target.value || "0", 10) })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Disk quota (MB): {scale.diskMb}</Label>
                  <Slider value={[scale.diskMb]} min={1024} max={8192} step={512} onValueChange={(v) => setScale({ ...scale, diskMb: v[0] })} />
                  <Input type="number" value={scale.diskMb} onChange={(e) => setScale({ ...scale, diskMb: parseInt(e.target.value || "0", 10) })} />
                </div>
              </div>
              <div className="mt-4 p-3 rounded-md border">
                <div className="text-sm font-medium mb-2">Preview</div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>Instances: {scale.instances}</li>
                  <li>Memory: {scale.memoryMb} MB</li>
                  <li>Disk: {scale.diskMb} MB</li>
                </ul>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowScale(false)}>Cancel</Button>
                <Button onClick={() => setShowScale(false)}>Apply Scaling</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Environment Viewer */}
        <TabsContent value="env" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <EnvSection title="VCAP_APPLICATION" data={envSystem.VCAP_APPLICATION} />
            <EnvSection title="VCAP_SERVICES" data={envSystem.VCAP_SERVICES} />
            <EnvSection title="User-Provided" data={envUser} />
            <EnvSection title="Custom Variables" data={envCustom} />
          </div>
        </TabsContent>

        {/* Error Analysis */}
        <TabsContent value="errors" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><History className="h-5 w-5" /> Error analysis</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAnalysisLogs(generateMockLogs(500))}>
                    <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Errors (last sample)</div>
                    <div className="text-2xl font-semibold">{analysis.errors}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Warnings (last sample)</div>
                    <div className="text-2xl font-semibold">{analysis.warns}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Error rate</div>
                    <div className="text-2xl font-semibold">{analysis.errorRate}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Last error</div>
                    <div className="text-2xl font-semibold">{analysis.lastErrorTs ? formatSince(analysis.lastErrorTs) : "—"}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md border">
                  <div className="p-3">
                    <div className="text-sm font-medium mb-2">Top error messages</div>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Message</TableHead>
                            <TableHead className="w-24">Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysis.topErrors.map((e, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm">{e.message}</TableCell>
                              <TableCell><Badge variant="secondary">{e.count}</Badge></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border">
                  <div className="p-3">
                    <div className="text-sm font-medium mb-2">Recent error events</div>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysis.events.map((ev, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs text-muted-foreground">{new Date(ev.ts).toLocaleTimeString()}</TableCell>
                              <TableCell><Badge variant={ev.type === "app.crash" ? "destructive" : "secondary"}>{ev.type}</Badge></TableCell>
                              <TableCell className="text-sm">{ev.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Start/Stop Controls */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Power className="h-4 w-4" /> Application lifecycle
          </div>
          <div className="flex gap-2">
            <ConfirmButton
              variant="destructive"
              label="Stop"
              confirmTitle="Stop application"
              confirmDesc="Are you sure you want to stop this app?"
            >
              <StopCircle className="h-4 w-4 mr-2" /> Stop
            </ConfirmButton>
            <ConfirmButton
              variant="default"
              label="Start"
              confirmTitle="Start application"
              confirmDesc="Start the app with current scale settings?"
            >
              <Play className="h-4 w-4 mr-2" /> Start
            </ConfirmButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfirmButton({
  children,
  label,
  confirmTitle,
  confirmDesc,
  variant = "default",
}: {
  children: React.ReactNode;
  label: string;
  confirmTitle: string;
  confirmDesc: string;
  variant?: "default" | "destructive" | "secondary" | "outline" | "ghost" | "link";
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>{children}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{confirmTitle}</DialogTitle>
          <DialogDescription>{confirmDesc}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EnvSection({ title, data }: { title: string; data: any }) {
  const [expanded, setExpanded] = useState(false);
  const jsonText = JSON.stringify(data, null, 2);
  const handleCopy = () => navigator.clipboard.writeText(jsonText);
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="text-sm">{title}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={handleCopy}>Copy</Button>
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {expanded ? (
          <div className="rounded-md border bg-muted">
            <div className="p-3">
              <div className="max-h-[50vh] overflow-auto">
                <JsonViewer data={data} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Hidden. Click Expand to view JSON.</div>
        )}
      </CardContent>
    </Card>
  );
}

function JsonViewer({ data }: { data: any }) {
  const renderNode = (key: string | null, value: any, level = 0): JSX.Element => {
    const pad = { paddingLeft: `${level * 16}px` } as React.CSSProperties;
    const isObj = value !== null && typeof value === "object";
    if (isObj) {
      const isArray = Array.isArray(value);
      const entries = isArray ? (value as any[]).map((v, i) => [String(i), v]) : Object.entries(value as Record<string, any>);
      return (
        <details open style={pad}>
          <summary className="cursor-pointer text-xs">
            {key !== null && <span className="text-muted-foreground">{key}: </span>}
            <span className="text-muted-foreground">{isArray ? "[...]" : "{...}"}</span>
          </summary>
          <div className="mt-1">
            {entries.map(([k, v]: any) => (
              <div key={k}>{renderNode(k, v, level + 1)}</div>
            ))}
          </div>
        </details>
      );
    } else {
      const type = typeof value;
      const valueClass =
        type === "string"
          ? "text-primary"
          : type === "number"
          ? "text-foreground"
          : type === "boolean"
          ? "text-foreground"
          : "text-muted-foreground";
      const display = key && isSensitive(key) && typeof value === "string" ? "****" : String(value);
      return (
        <div style={pad}>
          {key !== null && <span className="text-muted-foreground">{key}: </span>}
          <span className={valueClass}>{type === "string" ? `"${display}"` : display}</span>
        </div>
      );
    }
  };

  return <div className="font-mono text-xs leading-5 whitespace-pre-wrap break-words">{renderNode(null, data, 0)}</div>;
}