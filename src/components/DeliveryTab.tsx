import React, { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, Play, Package, Info, ChevronDown } from "lucide-react";
type JobStatus = "passed" | "failed" | "running";
type JobType = "Deploy" | "Validate" | "Monitor" | "Registrar";
type JobRow = {
  type: JobType;
  job: string;
  landscapeId: string;
  landscapeName: string;
  pipeline: string;
  lastBuild: string;
  result: JobStatus;
  duration: string;
  owner: string;
  // Details for expanded view
  message: string;
  commitUrl: string;
  jenkinsUrl: string;
};
interface DeliveryTabProps {
  selectedLandscape: string | null;
  landscapes: {
    id: string;
    name: string;
  }[];
}
const statusClasses: Record<JobStatus, string> = {
  passed: "bg-success",
  failed: "bg-destructive",
  running: "bg-warning"
};
const resultBadgeClasses: Record<JobStatus, string> = {
  passed: "bg-success/15 text-success border-success/20",
  failed: "bg-destructive/15 text-destructive border-destructive/20",
  running: "bg-warning/15 text-warning border-warning/20"
};
const resultLabels: Record<JobStatus, string> = {
  passed: "Passed",
  failed: "Failed",
  running: "Running"
};
function StatusDot({
  status
}: {
  status: JobStatus;
}) {
  return <span className={`inline-block w-2.5 h-2.5 aspect-square rounded-full shrink-0 self-start ${statusClasses[status]}`} aria-label={status} />;
}
function hash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = h * 31 + input.charCodeAt(i) >>> 0;
  }
  return h;
}
function pickStatus(seed: number): JobStatus {
  const r = seed % 100;
  if (r < 70) return "passed"; // 70%
  if (r < 90) return "failed"; // 20%
  return "running"; // 10%
}
function buildNumber(seed: number) {
  return `#${seed % 9000 + 1000}`;
}
function buildDuration(seed: number, result: JobStatus) {
  if (result === "running") return "—";
  const m = seed % 22 + 2; // 2-23 mins
  const s = seed % 59; // 0-58 sec
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
function truncateMiddle(str: string, max = 72) {
  if (str.length <= max) return str;
  const half = Math.floor((max - 3) / 2);
  return `${str.slice(0, half)}...${str.slice(-half)}`;
}
function makeDetails(job: string, seed: number) {
  const ticket = `HCPCM-${seed % 900000 + 100000}`;
  const pr = `#${seed % 99999 + 1}`;
  const suffixes = ["fix-missing-metrics", "bump-dependencies", "stabilize-pipeline", "hardening", "refactor-modules"];
  const suffix = suffixes[seed % suffixes.length];
  const message = `${ticket} ${suffix} (${pr})`;
  const buildId = seed % 200000 + 1000;
  const jenkinsUrl = `https://jenkins-prod.sbz.c.eu-de-1.cloud.sap/job/${job}/${buildId}/`;
  // Generate a pseudo commit hash (40 chars)
  const num = seed * 2654435761 >>> 0;
  const hash = num.toString(16).padStart(8, "0");
  const commitHash = (hash + hash + hash + hash + hash).slice(0, 40);
  const commitUrl = `https://github.tools.sap/cf-live-realm/cf-eu10-canary-landscape/commit/${commitHash}`;
  return {
    message,
    jenkinsUrl,
    commitUrl
  };
}
export default function DeliveryTab({
  selectedLandscape,
  landscapes
}: DeliveryTabProps) {
  // Generate mock rows for all landscapes
  const data = useMemo(() => {
    const deployJobs = ["deploy-core-commercialization-foundation", "deploy-cloud-management-foundation-services", "deploy-cloudfoundry-runtime-environment", "deploy-subscription-management"];
    const validateBases = ["core-commercialization-foundation", "cloud-management-foundation-services"];
    const monitorJobs = ["monitor-core-commercialization-foundation", "monitor-cloud-management-foundation-services"];
    const registrarJobs = ["core-commercialization-foundation-registrar"];
    const deployRows: JobRow[] = [];
    const validateGroups: {
      title: string;
      rows: JobRow[];
    }[] = [];
    const monitorRows: JobRow[] = [];
    const registrarRows: JobRow[] = [];

    // Deploy
    for (const l of landscapes) {
      for (const j of deployJobs) {
        const seed = hash(l.id + j);
        const result = pickStatus(seed);
        const d = makeDetails(j, seed);
        deployRows.push({
          type: "Deploy",
          job: j,
          landscapeId: l.id,
          landscapeName: l.name,
          pipeline: "landscape-update",
          lastBuild: buildNumber(seed),
          result,
          duration: buildDuration(seed, result),
          owner: seed % 3 === 0 ? "alice" : "svc-bot",
          message: d.message,
          commitUrl: d.commitUrl,
          jenkinsUrl: d.jenkinsUrl
        });
      }
    }

    // Validate groups (per delivery)
    for (const base of validateBases) {
      const title = `deploy-${base}`;
      const rows: JobRow[] = [];
      for (const l of landscapes) {
        const job1 = `validate-${base}`;
        const seed1 = hash(l.id + job1);
        const result1 = pickStatus(seed1);
        const d1 = makeDetails(job1, seed1);
        rows.push({
          type: "Validate",
          job: job1,
          landscapeId: l.id,
          landscapeName: l.name,
          pipeline: "landscape-update",
          lastBuild: buildNumber(seed1),
          result: result1,
          duration: buildDuration(seed1, result1),
          owner: "svc-bot",
          message: d1.message,
          commitUrl: d1.commitUrl,
          jenkinsUrl: d1.jenkinsUrl
        });
        if (base === "core-commercialization-foundation") {
          const job2 = `validate-${base}-registrar`;
          const seed2 = hash(l.id + job2);
          const result2 = pickStatus(seed2);
          const d2 = makeDetails(job2, seed2);
          rows.push({
            type: "Validate",
            job: job2,
            landscapeId: l.id,
            landscapeName: l.name,
            pipeline: "landscape-update",
            lastBuild: buildNumber(seed2),
            result: result2,
            duration: buildDuration(seed2, result2),
            owner: "svc-bot",
            message: d2.message,
            commitUrl: d2.commitUrl,
            jenkinsUrl: d2.jenkinsUrl
          });
        }
      }
      validateGroups.push({
        title,
        rows
      });
    }

    // Merge CMFS validations into CCF group and drop extra card
    {
      const ccf = validateGroups.find(g => g.title === "deploy-core-commercialization-foundation");
      const cmfs = validateGroups.find(g => g.title === "deploy-cloud-management-foundation-services");
      if (ccf && cmfs) {
        ccf.rows.push(...cmfs.rows);
        validateGroups.splice(validateGroups.indexOf(cmfs), 1);
      }
    }

    // Monitor
    for (const l of landscapes) {
      for (const j of monitorJobs) {
        const seed = hash(l.id + j);
        const result = pickStatus(seed);
        const d = makeDetails(j, seed);
        monitorRows.push({
          type: "Monitor",
          job: j,
          landscapeId: l.id,
          landscapeName: l.name,
          pipeline: "landscape-monitoring",
          lastBuild: buildNumber(seed),
          result,
          duration: "—",
          owner: "system",
          message: d.message,
          commitUrl: d.commitUrl,
          jenkinsUrl: d.jenkinsUrl
        });
      }
    }

    // Registrar
    for (const l of landscapes) {
      for (const j of registrarJobs) {
        const seed = hash(l.id + j);
        const result = pickStatus(seed);
        const d = makeDetails(j, seed);
        registrarRows.push({
          type: "Registrar",
          job: j,
          landscapeId: l.id,
          landscapeName: l.name,
          pipeline: "landscape-update",
          lastBuild: buildNumber(seed),
          result,
          duration: buildDuration(seed, result),
          owner: "svc-bot",
          message: d.message,
          commitUrl: d.commitUrl,
          jenkinsUrl: d.jenkinsUrl
        });
      }
    }
    return {
      deployRows,
      validateGroups,
      monitorRows,
      registrarRows
    };
  }, [landscapes]);
  const filterByLandscape = (rows: JobRow[]) => {
    if (!selectedLandscape) return [];
    return rows.filter(r => r.landscapeId === selectedLandscape);
  };
  const Row = ({
    r
  }: {
    r: JobRow;
  }) => {
    const [open, setOpen] = React.useState(false);
    const colSpan = 6;
    const detailsId = `${r.type}-${r.job}-${r.landscapeId}-${r.lastBuild}-details`;
    return <>
      <TableRow data-state={open ? "open" : "closed"}>
        <TableCell>
          <div className="min-w-[260px]">
            <div className="flex items-start gap-2">
              <StatusDot status={r.result} />
              <span className="font-medium leading-tight">{r.job}</span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <Badge variant="outline">{r.type}</Badge>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Button variant="link" size="sm" className="px-0">
            {r.landscapeName}
          </Button>
        </TableCell>
        <TableCell>{r.lastBuild}</TableCell>
        <TableCell>
          <Badge variant="outline" className={resultBadgeClasses[r.result]}>
            {resultLabels[r.result]}
          </Badge>
        </TableCell>
        <TableCell>{r.duration}</TableCell>
        
        <TableCell>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" title="Open in Concourse">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Re-run with params">
              <Play className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" title={open ? "Hide details" : "Show details"} aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(v => !v)}>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {open && <TableRow>
          <TableCell colSpan={colSpan} className="p-0">
            <div id={detailsId} className="px-4 py-3 border-t border-border text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Message</div>
                  <div className="mt-1 space-y-1">
                    <div className="font-medium">{r.message}</div>
                    <a href={r.jenkinsUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4 break-all">
                      {truncateMiddle(r.jenkinsUrl, 88)}
                    </a>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Commit</div>
                  <div className="mt-1">
                    <a href={r.commitUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4 break-all">
                      {truncateMiddle(r.commitUrl, 88)}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>}
    </>;
  };
  const NARow = () => <TableRow>
      <TableCell>
        <div className="min-w-[260px]">
          <div className="flex items-start gap-2">
            <span className="inline-block w-2.5 h-2.5 aspect-square rounded-full bg-muted shrink-0 self-start" aria-hidden />
            <span className="font-medium leading-tight">N/A</span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <Badge variant="outline">N/A</Badge>
          </div>
        </div>
      </TableCell>
      <TableCell>N/A</TableCell>
      <TableCell>N/A</TableCell>
      <TableCell>N/A</TableCell>
      <TableCell>N/A</TableCell>
      <TableCell>
        <div className="flex items-center gap-2 opacity-50">
        <ExternalLink className="h-4 w-4" />
          <Play className="h-4 w-4" />
          <ChevronDown className="h-4 w-4" />
        </div>
      </TableCell>
    </TableRow>;
  const showNA = !selectedLandscape;
  return <div className="space-y-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="h-5 w-5" aria-hidden />
          <h3 className="text-lg font-semibold">Delivery</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          View Concourse delivery executions by group. Use the global landscape filter to narrow results.
        </p>
      </header>

      {showNA && <Alert className="border border-input">
          <Info className="h-4 w-4" />
          <AlertTitle>Landscape required</AlertTitle>
          <AlertDescription>
            Choose a landscape from the global filter to see real execution results. Showing N/A placeholders.
          </AlertDescription>
        </Alert>}

      {/* Deploy */}
      <section>
        <h4 className="text-base font-semibold mb-3">Deploy</h4>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Landscape</TableHead>
                  <TableHead>Last build</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showNA ? <NARow /> : [...filterByLandscape(data.deployRows), ...filterByLandscape(data.registrarRows)].map(r => <Row key={`${r.type}-${r.job}-${r.landscapeId}-${r.lastBuild}`} r={r} />)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Validate */}
      <section>
        <h4 className="text-base font-semibold mb-3">Validate</h4>
        <div className="space-y-4">
          {data.validateGroups.map(g => <Card key={g.title}>
              
              <CardContent className="p-0">
                <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Landscape</TableHead>
                        <TableHead>Last build</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {showNA ? <NARow /> : filterByLandscape(g.rows).map(r => <Row key={`${g.title}-${r.job}-${r.landscapeId}-${r.lastBuild}`} r={r} />)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>)}
        </div>
      </section>

      {/* Monitor */}
      <section>
        <h4 className="text-base font-semibold mb-3">Monitor</h4>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Landscape</TableHead>
                  <TableHead>Last build</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showNA ? <NARow /> : filterByLandscape(data.monitorRows).map(r => <Row key={`${r.job}-${r.landscapeId}-${r.lastBuild}`} r={r} />)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

    </div>;
}