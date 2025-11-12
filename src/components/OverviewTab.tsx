import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Clock, ExternalLink, GitBranch, Github, History, ListChecks, Play, Power, RefreshCcw, Server, ShieldCheck, SlidersHorizontal, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CircleGauge from "@/components/ui/circle-gauge";

// Use same data source as timelines/component details for versions
import accountsServiceData from '@/data/cis-components/accounts-service.json';
import billingServiceData from '@/data/cis-components/billing-service.json';
import orderServiceData from '@/data/cis-components/order-service.json';
import paymentServiceData from '@/data/cis-components/payment-service.json';
import notificationServiceData from '@/data/cis-components/notification-service.json';
import userServiceData from '@/data/cis-components/user-service.json';

// Types
interface OverviewProps {
  componentId: string | null;
  componentName: string;
  description: string;
  landscapeId?: string | null;
  links?: Partial<Record<"github" | "jenkins" | "sonarqube" | "swagger" | "health", string>>;
  status?: "healthy" | "warning" | "error";
  coverage?: number;
  vulnerabilities?: number;
  deployedVersion?: string | null;
}

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

const pct = (n: number) => `${n.toFixed(1)}%`;
const bytesToMb = (mb: number) => `${mb} MB`;
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
    const running = Math.random() > 0.05;
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

const teams = ["Team Lior","Team Zohar","Team Avihai","Team Eli","Team Ariel","Team Eyal","Team Yael","Team Naomi","Team Sasha","Team Alex"] as const;
const teamFor = (id: string | null) => {
  if (!id) return teams[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return teams[h % teams.length];
};

export default function OverviewTab({ componentId, componentName, description, landscapeId, links, status = "healthy", coverage = 0, vulnerabilities = 0, deployedVersion = null }: OverviewProps) {
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<InstanceRow[]>(() => generateMockInstances(6));
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof InstanceRow>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

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

  const statusColor = status === "healthy" ? "bg-green-500" : status === "warning" ? "bg-amber-500" : "bg-red-500";
  const qualityGate: "passed" | "warning" | "failed" = vulnerabilities > 3 ? "failed" : vulnerabilities > 0 ? "warning" : "passed";

  // Trends & sample metrics (mocked)
  const cpuTrend = useMemo(() => Array.from({ length: 24 }).map((_, i) => ({ t: i, cpu: Math.round(30 + Math.sin(i / 2) * 12 + Math.random() * 6) })), []);
  const memTrend = useMemo(() => Array.from({ length: 24 }).map((_, i) => ({ t: i, mem: Math.round(55 + Math.cos(i / 3) * 10 + Math.random() * 8) })), []);
  const p95Trend = useMemo(() => Array.from({ length: 24 }).map((_, i) => ({ t: i, p95: Math.round(260 + Math.sin(i / 4) * 60 + Math.random() * 40) })), []);

  const availabilityYtd = 99.8;

  const componentVersions = useMemo(() => ({
    'accounts-service': accountsServiceData,
    'billing-service': billingServiceData,
    'order-service': orderServiceData,
    'payment-service': paymentServiceData,
    'notification-service': notificationServiceData,
    'user-service': userServiceData
  }), []);

  const effectiveVersion = useMemo(() => {
    if (!landscapeId || !componentId) return null;
    if (deployedVersion) return deployedVersion;
    const data = (componentVersions as Record<string, any[]>)[componentId];
    const match = data?.find((d: any) => d.landscape === landscapeId);
    return match?.buildProperties?.version ?? null;
  }, [componentId, landscapeId, deployedVersion, componentVersions]);

  const testStats = useMemo(() => {
    const runs = Array.from({ length: 12 }, () => 92 + Math.random() * 8);
    const passRate = runs.reduce((a, b) => a + b, 0) / runs.length;
    const avgDurationMin = Math.round(12 + Math.random() * 5);
    const flaky = Math.max(0, Math.round(5 - coverage / 25));
    return { passRate, avgDurationMin, flaky };
  }, [coverage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{componentName}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">API Service</Badge>
            <Badge variant="outline">{teamFor(componentId)}</Badge>
            <Badge variant="outline">{landscapeId || "no landscape"}</Badge>
            <Badge variant="outline" className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> master: {status === "healthy" ? "green" : status}</Badge>
            <Badge variant="outline" className="border-success text-success">v{landscapeId ? (effectiveVersion ?? "—") : "N/A"}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          
          {links?.github && (
            <Button asChild variant="outline" size="sm"><a href={links.github} target="_blank" rel="noreferrer"><Github className="h-4 w-4 mr-2" /> GitHub</a></Button>
          )}
          {links?.jenkins && (
            <Button asChild variant="outline" size="sm"><a href={links.jenkins} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" /> Jenkins</a></Button>
          )}
          {links?.sonarqube && (
            <Button asChild variant="outline" size="sm"><a href={links.sonarqube} target="_blank" rel="noreferrer"><ShieldCheck className="h-4 w-4 mr-2" /> SonarQube</a></Button>
          )}
          {links?.health && (
            <Button asChild variant="outline" size="sm"><a href={links.health} target="_blank" rel="noreferrer"><Activity className="h-4 w-4 mr-2" /> Health</a></Button>
          )}
        </div>
      </header>


      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Runtime Metrics Snapshot */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Runtime Metrics Snapshot</CardTitle>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 400); }}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {(() => {
              const cpu = cpuTrend[cpuTrend.length - 1]?.cpu || 0;
              const mem = memTrend[memTrend.length - 1]?.mem || 0;
              const p95 = p95Trend[p95Trend.length - 1]?.p95 || 0;
              const p95Score = Math.max(0, Math.min(100, (300 / (p95 || 1)) * 100));
              return (
                <>
                  <div className="flex flex-col items-center">
                    <CircleGauge value={cpu} label="CPU" sublabel={`${cpu}%`} colorClass="text-primary" />
                  </div>
                  <div className="flex flex-col items-center">
                    <CircleGauge value={mem} label="Memory" sublabel={`${mem}%`} colorClass="text-primary" />
                  </div>
                  <div className="flex flex-col items-center">
                    <CircleGauge value={p95Score} label="p95 (<=300ms)" sublabel={`${p95}ms`} colorClass="text-success" />
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        {/* Health & Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Health & Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-24 animate-pulse rounded-md bg-muted" />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${statusColor}`} />
                    <div className="text-sm">Status: <span className="font-medium">{status === "healthy" ? "up" : status}</span></div>
                  </div>
                  <div className="text-xs text-muted-foreground">Last check {formatSince(new Date().toISOString())}</div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Active alerts</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> High memory usage on instance 3</div>
                      <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Error rate spike in /orders</div>
                      <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Slow DB queries detected</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <CircleGauge value={availabilityYtd} label="Availability YTD" colorClass="text-success" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4" /> Test Results</CardTitle>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 400); }}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <CircleGauge value={testStats.passRate} label="Pass rate" colorClass="text-success" />
              </div>
              <div className="flex flex-col items-center">
                <CircleGauge value={Math.max(0, 100 - testStats.flaky * 15)} label="Stability" sublabel={`${testStats.flaky} flaky`} colorClass="text-primary" />
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-sm text-muted-foreground">Avg duration</div>
                <div className="text-2xl font-semibold">{testStats.avgDurationMin}m</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Based on last 12 runs. No external build links shown.</div>
          </CardContent>
        </Card>

        {/* Quality Scoreboard */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Quality Scoreboard</CardTitle>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 400); }}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-24 animate-pulse rounded-md bg-muted" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center">
                  <CircleGauge value={coverage} label="Coverage" colorClass="text-primary" />
                </div>
                <div className="flex flex-col items-center">
                  <CircleGauge value={Math.max(0, 100 - vulnerabilities * 20)} label="Risk Score" colorClass="text-primary" />
                </div>
                <div className="flex flex-col items-center">
                  <CircleGauge value={qualityGate === "passed" ? 100 : qualityGate === "warning" ? 60 : 20} label="Quality Gate" colorClass={qualityGate === "passed" ? "text-success" : qualityGate === "warning" ? "text-warning" : "text-destructive"} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DORA Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> DORA Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <CircleGauge value={80} label="Deploy Frequency" sublabel="4/day" colorClass="text-success" />
            </div>
            <div className="flex flex-col items-center">
              <CircleGauge value={75} label="Lead Time" sublabel="6h" colorClass="text-primary" />
            </div>
            <div className="flex flex-col items-center">
              <CircleGauge value={93} label="Change Failure" sublabel="7%" colorClass="text-success" />
            </div>
            <div className="flex flex-col items-center">
              <CircleGauge value={95} label="MTTR" sublabel="1.2h" colorClass="text-success" />
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
    );
}
