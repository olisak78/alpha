import { useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Download, Upload, Plus, Scissors, Trash2 } from "lucide-react";
import { useOnDutyData } from "@/hooks/useOnDutyData";

function YearPicker({ year, setYear }: { year: number; setYear: (y: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setYear(year - 1)}>-</Button>
      <div className="w-24">
        <Input type="number" value={year} onChange={(e)=>setYear(parseInt(e.target.value || String(new Date().getFullYear())))}/>
      </div>
      <Button variant="outline" size="sm" onClick={() => setYear(year + 1)}>+</Button>
    </div>
  );
}

export default function OnDutyPage() {
  const {
    year, setYear,
    members,
    onCall, setOnCall,
    onDuty, setOnDuty,
    exportOnCallToExcel, importOnCallFromExcel,
    exportOnDutyToExcel, importOnDutyFromExcel,
  } = useOnDutyData();

  const [showOnCall, setShowOnCall] = useState(false); // false = On Duty, true = On Call

  // Upload dialog states
  const [uploadOpen, setUploadOpen] = useState(false);
  const uploadTypeRef = useRef<"oncall" | "onduty">("oncall");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const memberOptions = useMemo(() => members, [members]);

  function addOnCallRow() {
    const id = `oc_${Date.now()}`;
    const today = new Date();
    const start = today.toISOString().slice(0,10);
    const end = new Date(today.getTime() + 6*24*3600*1000).toISOString().slice(0,10);
    setOnCall([...(onCall || []), { id, start, end, type: "week", assigneeId: memberOptions[0]?.id || "", called: false }]);
  }

  function updateOnCall(id: string, patch: Partial<{ start: string; end: string; type: "week"|"weekend"; assigneeId: string; called: boolean; }>) {
    setOnCall(onCall.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  function dateMid(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const mid = new Date((s.getTime() + e.getTime())/2);
    const midDay = new Date(mid.toISOString().slice(0,10));
    const prev = new Date(midDay.getTime() - 24*3600*1000);
    return { midStartEnd: [start, prev.toISOString().slice(0,10)] as const, midNextStartEnd: [midDay.toISOString().slice(0,10), end] as const };
  }

  function splitOnCallRow(id: string) {
    const row = onCall.find(r => r.id === id);
    if (!row) return;
    const { midStartEnd, midNextStartEnd } = dateMid(row.start, row.end);
    const a = { ...row, id: `${row.id}_a`, start: midStartEnd[0], end: midStartEnd[1] };
    const b = { ...row, id: `${row.id}_b`, start: midNextStartEnd[0], end: midNextStartEnd[1] };
    setOnCall(onCall.flatMap(r => r.id === id ? [a, b] : [r]));
  }

  function deleteOnCallRow(id: string) {
    setOnCall(onCall.filter(r => r.id !== id));
  }

  function addOnDutyRow() {
    const id = `od_${Date.now()}`;
    const d = new Date();
    const iso = d.toISOString().slice(0,10);
    setOnDuty([...(onDuty || []), { id, date: iso, assigneeId: memberOptions[0]?.id || "" }]);
  }
  function updateOnDuty(id: string, patch: Partial<{ date: string; assigneeId: string }>) {
    setOnDuty(onDuty.map(r => r.id === id ? { ...r, ...patch } : r));
  }
  function deleteOnDuty(id: string) {
    setOnDuty(onDuty.filter(r => r.id !== id));
  }

  async function handleUploadConfirm() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const t = uploadTypeRef.current;
    if (t === "oncall") await importOnCallFromExcel(file);
    if (t === "onduty") await importOnDutyFromExcel(file);
    setUploadOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">On Duty</h1>
        <YearPicker year={year} setYear={setYear} />
      </header>

      <div className="mt-6 space-y-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{showOnCall ? "On Call" : "On Duty"} for {year}</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">On Duty</span>
                  <Switch checked={showOnCall} onCheckedChange={setShowOnCall} />
                  <span className="text-sm">On Call</span>
                </div>
                {!showOnCall ? (
                  <>
                    <Button size="sm" variant="outline" onClick={exportOnDutyToExcel}>
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                    <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => { uploadTypeRef.current = "onduty"; }}>
                          <Upload className="h-4 w-4 mr-1" /> Upload
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Upload On Duty Excel</DialogTitle>
                          <DialogDescription>Select a .xlsx file to import.</DialogDescription>
                        </DialogHeader>
                        <Input ref={fileRef as any} type="file" accept=".xlsx,.xls" />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                          <Button onClick={handleUploadConfirm}>Upload</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={exportOnCallToExcel}>
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                    <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => { uploadTypeRef.current = "oncall"; }}>
                          <Upload className="h-4 w-4 mr-1" /> Upload
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Upload On Call Excel</DialogTitle>
                          <DialogDescription>Select a .xlsx file to import.</DialogDescription>
                        </DialogHeader>
                        <Input ref={fileRef as any} type="file" accept=".xlsx,.xls" />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                          <Button onClick={handleUploadConfirm}>Upload</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!showOnCall ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Button size="sm" onClick={addOnDutyRow}><Plus className="h-4 w-4 mr-1"/>Add Row</Button>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date (weekday)</TableHead>
                          <TableHead>Assignee</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {onDuty.map(row => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <Input type="date" value={row.date} onChange={(e)=>updateOnDuty(row.id, { date: e.target.value })} />
                            </TableCell>
                            <TableCell>
                              <Select value={row.assigneeId} onValueChange={(v)=>updateOnDuty(row.id, { assigneeId: v })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent>
                                  {memberOptions.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={()=>deleteOnDuty(row.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Button size="sm" onClick={addOnCallRow}><Plus className="h-4 w-4 mr-1"/>Add Row</Button>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Start</TableHead>
                          <TableHead>End</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Assignee</TableHead>
                          <TableHead>Called?</TableHead>
                          <TableHead className="w-32">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {onCall.map(row => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <Input type="date" value={row.start} onChange={(e)=>updateOnCall(row.id, { start: e.target.value })} />
                            </TableCell>
                            <TableCell>
                              <Input type="date" value={row.end} onChange={(e)=>updateOnCall(row.id, { end: e.target.value })} />
                            </TableCell>
                            <TableCell>
                              <Select value={row.type} onValueChange={(v: any)=>updateOnCall(row.id, { type: v })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="week">Week</SelectItem>
                                  <SelectItem value="weekend">Weekend</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select value={row.assigneeId} onValueChange={(v)=>updateOnCall(row.id, { assigneeId: v })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent>
                                  {memberOptions.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <input type="checkbox" checked={!!row.called} onChange={(e)=>updateOnCall(row.id, { called: e.target.checked })} />
                            </TableCell>
                            <TableCell className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={()=>splitOnCallRow(row.id)} title="Split">
                                <Scissors className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={()=>deleteOnCallRow(row.id)} title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
