import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, FileUp, Plus, RefreshCw, Play, Pencil, Trash2, FileCode, Search, Upload, Download, Eye, KeyRound, Globe, Shield, ChevronDown, ChevronUp, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import yaml from "js-yaml";

// Lazy-loaded heavy libs
const LazySyntax = React.lazy(async () => {
  const mod = await import("react-syntax-highlighter");
  const style = await import("react-syntax-highlighter/dist/esm/styles/prism");
  return { default: (props: any) => React.createElement((mod as any).Prism, { ...props, style: (style as any).coy }) };
});

const LazyCodeMirror = React.lazy(async () => {
  const cm = await import("@uiw/react-codemirror");
  return { default: cm.default };
});

async function getYamlExt() { const m = await import("@codemirror/lang-yaml"); return m.yaml(); }
async function getJsonExt() { const m = await import("@codemirror/lang-json"); return m.json(); }

// Types
export type RTD = { group: string; version: string; kind: string; scope: "Cluster" | "Namespaced" | "Global"; shortName?: string; operations?: string[] };
export type Condition = { type: string; status: "True" | "False" | "Unknown"; lastTransitionTime: string; reason?: string; message?: string };
export type Metadata = { name: string; namespace?: string; uid: string; generation: number; creationTimestamp: string; labels?: Record<string, string>; annotations?: Record<string, string> };
export type Resource = { apiVersion: string; kind: string; metadata: Metadata; spec?: any; status?: { conditions?: Condition[]; url?: string } };
export type Event = { type: "Normal" | "Warning"; reason: string; message: string; time: string; involvedObject: { kind: string; name: string } };

const uuid = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = (Math.random()*16)|0; const v = c === "x" ? r : (r & 0x3) | 0x8; return v.toString(16); });

// Mock data
const landscapes = [
  { id: "cf-eu10-canary", label: "EU10 · Canary" },
  { id: "cf-us10-staging", label: "US10 · Staging" },
  { id: "cf-eu12", label: "EU12 · Prod" },
];

const MOCK_RTDS: RTD[] = [
  { group: "accounts.resource.api.sap", version: "v1", kind: "Folder", scope: "Global", shortName: "folder", operations: ["reconcile"] },
  { group: "accounts.resource.api.sap", version: "v1", kind: "Account", scope: "Global", shortName: "acct", operations: ["lock", "unlock"] },
  { group: "service.resource.api.sap", version: "v1", kind: "ServiceInstance", scope: "Namespaced", shortName: "si", operations: ["bind", "unbind", "recreate"] },
  { group: "service.resource.api.sap", version: "v1", kind: "ServiceBinding", scope: "Namespaced", shortName: "sb", operations: ["rotate-credentials"] },
  { group: "system.resource.api.sap", version: "v1", kind: "AtomConfig", scope: "Cluster", shortName: "atomcfg", operations: ["validate"] },
];

const seedResources = (): Record<string, Resource[]> => {
  const now = new Date().toISOString();
  
  // SAP specific paths
  const sapPaths = [
    "/sap",
    "/sap/com", 
    "/sap/s4hc",
    "/sap/s4hc/prod",
    "/sap/s4hc/dev",
    "/sap/nexsus/prod", 
    "/sap/nexsus/dev",
    "/sap/sygnavio/prod",
    "/sap/sygnavio/dev"
  ];
  
  // Create folder resources with SAP paths
  const folderResources: Resource[] = [];
  
  // Add specific SAP path folders
  sapPaths.forEach((path, i) => {
    const pathName = path.replace(/\//g, '-').substring(1) || 'root';
    folderResources.push({
      apiVersion: "accounts.resource.api.sap/v1", 
      kind: "Folder", 
      metadata: { 
        name: pathName,
        namespace: path,
        uid: uuid(), 
        generation: Math.floor(Math.random() * 10) + 1, 
        creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        labels: { 
          project: ["ic-automotive", "finance", "hr", "marketing"][Math.floor(Math.random() * 4)], 
          owner: ["team-alpha", "team-beta", "team-gamma", "team-delta"][Math.floor(Math.random() * 4)],
          path: path
        }, 
        annotations: { displayName: `SAP Folder: ${path}` } 
      }, 
      spec: { description: `SAP folder for ${path}` }, 
      status: { 
        conditions: [{ 
          type: "Ready", 
          status: Math.random() > 0.1 ? "True" : "False", 
          lastTransitionTime: now 
        }] 
      } 
    });
  });
  
  // Add additional generic folders to reach 60 total
  const remaining = 60 - sapPaths.length;
  for (let i = 0; i < remaining; i++) {
    folderResources.push({
      apiVersion: "accounts.resource.api.sap/v1", 
      kind: "Folder", 
      metadata: { 
        name: `folder-${i + 1}`, 
        uid: uuid(), 
        generation: Math.floor(Math.random() * 10) + 1, 
        creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        labels: { 
          project: ["ic-automotive", "finance", "hr", "marketing"][Math.floor(Math.random() * 4)], 
          owner: ["team-alpha", "team-beta", "team-gamma", "team-delta"][Math.floor(Math.random() * 4)]
        }, 
        annotations: { displayName: `Folder ${i + 1}` } 
      }, 
      spec: { description: `Generated folder ${i + 1}` }, 
      status: { 
        conditions: [{ 
          type: "Ready", 
          status: Math.random() > 0.1 ? "True" : "False", 
          lastTransitionTime: now 
        }] 
      } 
    });
  }

  const baseResources: Resource[] = [
    { apiVersion: "service.resource.api.sap/v1", kind: "ServiceInstance", metadata: { name: "order-processing-postgresql", namespace: "ic-automotive-quality-da2e27", uid: uuid(), generation: 7, creationTimestamp: now, labels: { service: "postgresql", plan: "large" } }, spec: { service: "postgresql", plan: "large", parameters: { storage: "500Gi" } }, status: { conditions: [{ type: "Ready", status: "True", lastTransitionTime: now }, { type: "BackupHealthy", status: "True", lastTransitionTime: now }], url: "postgres://10.0.12.34:5432/db" } },
    { apiVersion: "service.resource.api.sap/v1", kind: "ServiceBinding", metadata: { name: "order-processing-postgresql-binding", namespace: "ic-automotive-quality-da2e27", uid: uuid(), generation: 2, creationTimestamp: now, labels: { app: "order-processing" } }, spec: { instance: "order-processing-postgresql", secretName: "db-credentials" }, status: { conditions: [{ type: "Ready", status: "True", lastTransitionTime: now }] } },
    { apiVersion: "accounts.resource.api.sap/v1", kind: "Account", metadata: { name: "the-org", uid: uuid(), generation: 9, creationTimestamp: now, labels: { tenant: "ic-automotive", region: "eu10" } }, spec: { owner: "customer-xyz", billing: { model: "payg" } }, status: { conditions: [{ type: "Ready", status: "True", lastTransitionTime: now }] } },
    { apiVersion: "system.resource.api.sap/v1", kind: "AtomConfig", metadata: { name: "desk-local", uid: uuid(), generation: 1, creationTimestamp: now }, spec: { baseUrl: "https://canary.resource.api.sap", tokenRef: { secret: "atom-token" } }, status: { conditions: [{ type: "Valid", status: "True", lastTransitionTime: now }] } },
  ];
  
  const allResources = [...folderResources, ...baseResources];
  return Object.fromEntries(landscapes.map(l => [l.id, allResources.map(r => ({ ...r, metadata: { ...r.metadata, uid: uuid() } }))]));
};

const DB: { resourcesByLandscape: Record<string, Resource[]>; events: Event[] } = {
  resourcesByLandscape: seedResources(),
  events: [
    { type: "Normal", reason: "Reconciled", message: "ServiceInstance became Ready", time: new Date().toISOString(), involvedObject: { kind: "ServiceInstance", name: "order-processing-postgresql" } },
    { type: "Warning", reason: "Throttle", message: "API rate limiting encountered", time: new Date().toISOString(), involvedObject: { kind: "Folder", name: "e-mobility-da2e27" } },
  ],
};

const delay = (ms = 500) => new Promise(res => setTimeout(res, ms));
const mockApi = {
  listRTDs: async (): Promise<RTD[]> => { await delay(200); return MOCK_RTDS; },
  listResources: async (landscape: string, kind?: string): Promise<Resource[]> => { await delay(250); const all = DB.resourcesByLandscape[landscape] || []; return kind ? all.filter(r => r.kind === kind) : all; },
  getResource: async (landscape: string, kind: string, name: string): Promise<Resource | undefined> => { await delay(150); return DB.resourcesByLandscape[landscape]?.find(r => r.kind === kind && r.metadata.name === name); },
  applyResource: async (landscape: string, manifest: string): Promise<Resource> => {
    await delay(400);
    const obj = yaml.load(manifest) as Resource;
    if (!obj?.kind || !obj?.metadata?.name) throw new Error("Invalid manifest");
    const existingIdx = (DB.resourcesByLandscape[landscape] || []).findIndex(r => r.kind === obj.kind && r.metadata.name === obj.metadata?.name);
    const res: Resource = {
      ...obj,
      apiVersion: obj.apiVersion || `${MOCK_RTDS.find(r => r.kind===obj.kind)?.group}/${MOCK_RTDS.find(r => r.kind===obj.kind)?.version}`,
      metadata: { ...(obj.metadata as Metadata), name: obj.metadata!.name, generation: existingIdx>=0 ? (DB.resourcesByLandscape[landscape][existingIdx].metadata.generation+1) : 1, uid: existingIdx>=0 ? DB.resourcesByLandscape[landscape][existingIdx].metadata.uid : uuid(), creationTimestamp: new Date().toISOString() },
      status: { conditions: [{ type: "Ready", status: "True", lastTransitionTime: new Date().toISOString(), reason: existingIdx>=0?"MockPatched":"MockApplied" }] },
    };
    if (existingIdx>=0) DB.resourcesByLandscape[landscape][existingIdx] = res; else DB.resourcesByLandscape[landscape] = [res, ...(DB.resourcesByLandscape[landscape] || [])];
    return res;
  },
  deleteResource: async (landscape: string, kind: string, name: string): Promise<void> => { await delay(250); DB.resourcesByLandscape[landscape] = (DB.resourcesByLandscape[landscape] || []).filter(r => !(r.kind===kind && r.metadata.name===name)); },
  listEvents: async (_landscape: string, _filter?: { kind?: string; name?: string }) => { await delay(150); return DB.events; },
  runOperation: async (_landscape: string, _kind: string, _name: string, operation: string) => { await delay(500); return { ok: true, operation }; },
};

const fromNow = (iso?: string) => {
  if (!iso) return "";
  const now = Date.now();
  const time = new Date(iso).getTime();
  const diffMs = now - time;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
  
  if (diffYears > 0) return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
};

const StatusBadge: React.FC<{ conditions?: Condition[] }> = ({ conditions }) => {
  const ready = conditions?.find(c => c.type === "Ready")?.status === "True";
  const err = conditions?.find(c => c.status === "False" && c.type !== "Ready");
  if (err) return <Badge variant="destructive">Error</Badge>;
  return <Badge className={ready ? "" : "opacity-75"}>{ready ? "Ready" : "Unknown"}</Badge>;
};

const ReadonlyBlock: React.FC<{ value: any; syntax: "yaml" | "json" }> = ({ value, syntax }) => {
  const code = syntax === "yaml" ? yaml.dump(value) : JSON.stringify(value, null, 2);
  return (
    <Suspense fallback={<pre className="text-xs bg-muted rounded-xl p-3 overflow-auto max-h-96">{code}</pre>}>
      <LazySyntax language={syntax} customStyle={{ borderRadius: 12, padding: 12, maxHeight: 380, overflow: "auto", fontSize: 12 }}>
        {code}
      </LazySyntax>
    </Suspense>
  );
};

export default function UnifiedServicesConsole() {
  const [activeLandscape, setActiveLandscape] = useState(landscapes[0].id);
  const [rtds, setRtds] = useState<RTD[]>([]);
  const [selectedKind, setSelectedKind] = useState<string | undefined>("Folder");
  const [rtdSearch, setRtdSearch] = useState("");
  const [search, setSearch] = useState("");
  const [pathFilter, setPathFilter] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [manifest, setManifest] = useState<string>(`apiVersion: accounts.resource.api.sap/v1
kind: Folder
metadata:
  name: demo-folder
spec:
  description: Demo folder created from UI`);
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState<string>("");
  const [editSyntax, setEditSyntax] = useState<"yaml" | "json">("yaml");
  const [editorExt, setEditorExt] = useState<any[]>([]);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [atomConfig, setAtomConfig] = useState<any>(() => { try { return JSON.parse(localStorage.getItem("atomconfig") || "null"); } catch { return null; } });

  useEffect(() => { mockApi.listRTDs().then(setRtds); }, []);
  useEffect(() => { (async () => { setLoading(true); const list = await mockApi.listResources(activeLandscape, selectedKind); setResources(list); setLoading(false); })(); }, [activeLandscape, selectedKind]);
  useEffect(() => { (async () => { if (!editOpen) return; const ext = editSyntax === "yaml" ? await getYamlExt() : await getJsonExt(); setEditorExt([ext]); })(); }, [editOpen, editSyntax]);

  const filtered = useMemo(() => {
    const baseFiltered = resources
      .filter(r => r.metadata.name.toLowerCase().includes(search.toLowerCase()))
      .filter(r => pathFilter ? (r.metadata.namespace || "/").toLowerCase().includes(pathFilter.toLowerCase()) : true);
    
    if (focusMode && selected) {
      return baseFiltered.filter(r => r.metadata.uid === selected.metadata.uid);
    }
    return baseFiltered;
  }, [resources, search, pathFilter, focusMode, selected]);
  
  const rtdFiltered = useMemo(() => rtds.filter(rt => [rt.kind, rt.group, rt.shortName].join(" ").toLowerCase().includes(rtdSearch.toLowerCase())), [rtds, rtdSearch]);
  
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const uploadAtomConfig = async (file: File) => {
    const text = await file.text();
    let cfg: any;
    try { cfg = file.name.endsWith(".json") ? JSON.parse(text) : yaml.load(text); } catch (e) { toast.error("Invalid Atomconfig file"); return; }
    localStorage.setItem("atomconfig", JSON.stringify(cfg));
    setAtomConfig(cfg);
    toast.success("Atomconfig uploaded – credentials stored locally");
  };

  const handleApply = async () => {
    try {
      setLoading(true);
      const res = await mockApi.applyResource(activeLandscape, manifest);
      toast.success(`Applied ${res.kind} “${res.metadata.name}”`);
      setSelected(res);
      const list = await mockApi.listResources(activeLandscape, selectedKind);
      setResources(list);
    } catch (e: any) {
      toast.error(e?.message || "Failed applying resource");
    } finally { setLoading(false); }
  };

  const handleDelete = async (r: Resource) => {
    await mockApi.deleteResource(activeLandscape, r.kind, r.metadata.name);
    toast.success(`Deleted ${r.kind} ${r.metadata.name}`);
    setSelected(null);
    setFocusMode(false);
    const list = await mockApi.listResources(activeLandscape, selectedKind);
    setResources(list);
  };

  const handleExportYaml = (r: Resource) => {
    const yamlContent = yaml.dump(r);
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${r.metadata.name}-${r.kind.toLowerCase()}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${r.kind} ${r.metadata.name} as YAML`);
  };

  const handleResourceClick = (r: Resource) => {
    setSelected(r);
    setFocusMode(true);
  };

  const exitFocusMode = () => {
    setFocusMode(false);
    setSelected(null);
  };

  const beginEdit = (r: Resource) => {
    setEditSyntax("yaml");
    setEditContent(yaml.dump(r));
    setEditOpen(true);
  };

  const beautify = () => {
    try {
      if (editSyntax === "yaml") {
        const obj = yaml.load(editContent);
        setEditContent(yaml.dump(obj));
      } else {
        const obj = JSON.parse(editContent);
        setEditContent(JSON.stringify(obj, null, 2));
      }
      toast.success("Beautified");
    } catch {
      toast.error("Invalid content, cannot beautify");
    }
  };

  const saveEdit = async () => {
    try {
      const toApply = editSyntax === "yaml" ? editContent : yaml.dump(JSON.parse(editContent));
      setLoading(true);
      const res = await mockApi.applyResource(activeLandscape, toApply);
      toast.success(`Updated ${res.kind} ${res.metadata.name}`);
      setEditOpen(false);
      setSelected(res);
      const list = await mockApi.listResources(activeLandscape, selectedKind);
      setResources(list);
    } catch (e: any) {
      toast.error(e?.message || "Failed saving edit");
    } finally { setLoading(false); }
  };

  const handlePreview = (r: Resource) => {
    setPreviewResource(r);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewResource(null);
  };

  return (
    <div className="w-full min-h-[600px] bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="px-4 py-3 flex items-center gap-3">
          <span className="font-semibold text-xl">Unified Services Console</span>
          
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4" />
              <Input className="pl-8 w-56" placeholder="Search resources by name" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Input className="w-56" placeholder="Filter by Path" value={pathFilter} onChange={e => setPathFilter(e.target.value)} />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="mr-2 w-4 h-4" /> Upload Atomconfig
            </Button>
            <input ref={fileInputRef} type="file" accept=".yaml,.yml,.json" className="hidden" onChange={(e) => e.target.files && uploadAtomConfig(e.target.files[0])} />
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 w-4 h-4" /> Apply Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Apply Resource Manifest</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Textarea rows={14} value={manifest} onChange={e => setManifest(e.target.value)} />
                  <div className="flex justify-between items-center">
                    <div className="text-xs opacity-70">Authenticated via <b>{atomConfig?.name || atomConfig?.clientId || "local demo"}</b></div>
                    <Button onClick={handleApply} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>} Apply</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Resource Preview Section */}
      {showPreview && previewResource && (
        <div className="px-4 py-3 border-b">
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{previewResource.kind} · {previewResource.metadata.name}</h3>
                <Button variant="ghost" size="icon" onClick={closePreview}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ReadonlyBlock value={previewResource} syntax="yaml" />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 px-4 py-4">
        {/* Sidebar: RTDs */}
        <div className="col-span-12 md:col-span-3">
          <Card className="sticky top-16">
            <CardContent className="p-0">
              <div className="p-3 border-b">
                <div className="font-medium mb-2">Resource Types</div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Search types (kind/group)" value={rtdSearch} onChange={e=>setRtdSearch(e.target.value)} />
                  <Button size="icon" variant="ghost" onClick={() => toast.info("RTDs refreshed (mock)")}> <RefreshCw className="w-4 h-4"/> </Button>
                </div>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="divide-y">
                  {rtdFiltered.slice(0, 6).map(rt => (
                    <button key={rt.kind} className={`w-full text-left px-3 py-2 hover:bg-muted/60 flex items-center justify-between ${selectedKind===rt.kind? "bg-muted" : ""}`} onClick={() => { setSelectedKind(rt.kind); setCurrentPage(1); }}>
                      <div>
                        <div className="text-sm font-medium">{rt.kind}</div>
                        <div className="text-xs opacity-70">{rt.group}/{rt.version} · {rt.scope}</div>
                      </div>
                      <Badge variant="outline">{resources.filter(r => r.kind===rt.kind).length}</Badge>
                    </button>
                  ))}
                  {rtdFiltered.length > 6 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      +{rtdFiltered.length - 6} more resource types...
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </div>

        {/* Main */}
        <div className="col-span-12 md:col-span-9">
          <Card>
            <CardContent className="p-0">
              <div className="p-3 border-b flex items-center justify-between">
                <div className="font-medium">{selectedKind}</div>
                <div className="text-xs opacity-70">{filtered.length} items</div>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">Path</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Age</th>
                      <th className="text-right px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="w-4 h-4 animate-spin inline-block mr-2"/> Loading…</td></tr>
                     ) : paginatedResources.length === 0 ? (
                      <tr><td colSpan={5} className="py-10 text-center opacity-70">No resources</td></tr>
                     ) : paginatedResources.map((r) => (
                      <tr key={r.metadata.uid} className="border-b hover:bg-muted/40">
                        <td className="px-3 py-2">
                          <button className="font-medium hover:underline" onClick={() => handleResourceClick(r)}>{r.metadata.name}</button>
                        </td>
                        <td className="px-3 py-2 text-xs opacity-80">{r.metadata.namespace || "/"}</td>
                        <td className="px-3 py-2"><StatusBadge conditions={r.status?.conditions} /></td>
                        <td className="px-3 py-2 text-xs opacity-70">{fromNow(r.metadata.creationTimestamp)}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handlePreview(r); }}><Eye className="w-4 h-4"/></Button>
                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleExportYaml(r); }}><Download className="w-4 h-4"/></Button>
                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleResourceClick(r); }}><Pencil className="w-4 h-4"/></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}><Trash2 className="w-4 h-4"/></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                                  <AlertDialogDescription>Are you sure you want to delete {r.kind} "{r.metadata.name}"? This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(r)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                     ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                            isActive={currentPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    {totalPages > 5 && <span className="px-2">...</span>}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="text-center text-xs text-muted-foreground mt-2">
                  Page {currentPage} of {totalPages} ({filtered.length} total resources)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resource Detail Overlay */}
      {focusMode && selected && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4">
          <Card className="w-full max-w-6xl max-h-[95vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-semibold">{selected.kind}: {selected.metadata.name}</h2>
                <p className="text-sm text-muted-foreground">Resource Details</p>
              </div>
              <Button size="sm" variant="ghost" onClick={exitFocusMode}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(95vh-120px)]">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-dashed">
                  <CardContent className="p-3">
                    <div className="font-medium mb-2">Metadata</div>
                    <div className="grid grid-cols-3 text-xs gap-2">
                      <div className="opacity-70">Name</div><div className="col-span-2">{selected.metadata.name}</div>
                      <div className="opacity-70">Namespace</div><div className="col-span-2">{selected.metadata.namespace || "—"}</div>
                      <div className="opacity-70">UID</div><div className="col-span-2 truncate">{selected.metadata.uid}</div>
                      <div className="opacity-70">Generation</div><div className="col-span-2">{selected.metadata.generation}</div>
                      <div className="opacity-70">Created</div><div className="col-span-2">{selected.metadata.creationTimestamp}</div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs opacity-70 mb-1">Labels</div>
                      <ReadonlyBlock value={selected.metadata.labels || {}} syntax="json" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="p-3 space-y-2">
                    <div className="font-medium">Status</div>
                    <div className="flex gap-2 items-center">
                      <StatusBadge conditions={selected.status?.conditions} />
                      <div className="text-xs opacity-70">{selected.status?.url}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-70 mb-1">Conditions</div>
                      <ReadonlyBlock value={selected.status?.conditions || []} syntax="json" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 border-dashed">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary"><Play className="w-4 h-4 mr-2"/> Touch Resource</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {(MOCK_RTDS.find(r=>r.kind===selected.kind)?.operations || ["reconcile"]).map(op => (
                              <DropdownMenuItem key={op} onClick={() => toast.promise(mockApi.runOperation(activeLandscape, selected.kind, selected.metadata.name, op), { loading: `Running ${op}…`, success: `${op} triggered`, error: `Failed ${op}` })} className="capitalize">{op}</DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" onClick={() => handleExportYaml(selected)}><Download className="w-4 h-4 mr-2"/> Export YAML</Button>
                        <Button variant="outline" onClick={() => beginEdit(selected)}><Pencil className="w-4 h-4 mr-2"/> Edit</Button>
                      </div>
                    </div>
                    <Tabs defaultValue="yaml">
                      <TabsList>
                        <TabsTrigger value="yaml">YAML</TabsTrigger>
                        <TabsTrigger value="json">JSON</TabsTrigger>
                        <TabsTrigger value="events">Events</TabsTrigger>
                      </TabsList>
                      <TabsContent value="yaml">
                        <ReadonlyBlock value={selected} syntax="yaml" />
                      </TabsContent>
                      <TabsContent value="json">
                        <ReadonlyBlock value={selected} syntax="json" />
                      </TabsContent>
                      <TabsContent value="events">
                        <EventsList landscape={activeLandscape} filter={{ kind: selected.kind, name: selected.metadata.name }} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      )}


      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Resource ({editSyntax.toUpperCase()})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex gap-2 justify-between items-center">
              <div className="text-xs opacity-70">Switch format to edit as:</div>
              <div className="flex gap-2">
                <Button size="sm" variant={editSyntax==='yaml'? 'default':'outline'} onClick={() => { try { const o = editSyntax==='yaml'? yaml.load(editContent) : JSON.parse(editContent); setEditContent(yaml.dump(o)); setEditSyntax('yaml'); } catch { toast.error('Cannot convert'); } }}>YAML</Button>
                <Button size="sm" variant={editSyntax==='json'? 'default':'outline'} onClick={() => { try { const o = editSyntax==='yaml'? yaml.load(editContent) : JSON.parse(editContent); setEditContent(JSON.stringify(o, null, 2)); setEditSyntax('json'); } catch { toast.error('Cannot convert'); } }}>JSON</Button>
              </div>
            </div>
            <div className="rounded-xl border">
              <Suspense fallback={<div className="p-4 text-sm"><Loader2 className="w-4 h-4 animate-spin inline-block mr-2"/> Loading editor…</div> }>
                <LazyCodeMirror value={editContent} height="360px" extensions={editorExt} onChange={(v: string) => setEditContent(v)} />
              </Suspense>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={beautify}>Beautify</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={saveEdit} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Save'}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventsList({ landscape, filter }: { landscape: string; filter?: { kind?: string; name?: string } }) {
  const [events, setEvents] = useState<Event[] | null>(null);
  useEffect(() => { (async () => setEvents(await mockApi.listEvents(landscape, filter)))(); }, [landscape, filter?.kind, filter?.name]);
  if (!events) return <div className="p-6 text-sm"><Loader2 className="w-4 h-4 animate-spin inline-block"/> Loading events…</div>;
  return (
    <div className="p-1">
      <div className="text-xs opacity-70 mb-2">{events.length} events</div>
      <div className="space-y-2">
        {events.map((e, i) => (
          <div key={i} className={`rounded-lg border p-2 ${e.type === "Warning" ? "border-destructive/30" : ""}`}>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={e.type === "Warning" ? "destructive" : "secondary"}>{e.type}</Badge>
              <div className="font-medium">{e.reason}</div>
              <div className="opacity-70">{e.time}</div>
            </div>
            <div className="text-sm mt-1">{e.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
