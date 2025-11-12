import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Clock, Eye, Edit, VolumeX, Play, Pause, Search, Filter, ChevronRight, History, Plus, Copy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

import { CreateAlertWizard } from './CreateAlertWizard';
import { AlertRule, mockAlertEvents, mockAlertRules, mockComponents, mockSilences, mockTeams } from '@/data/monitoring/mock-data';

interface AlertFilters {
    team: string;
    component: string;
    severity: string;
    state: string;
    environment: string;
    search: string;
}

export function AlertsDashboard() {
    const [filters, setFilters] = useState<AlertFilters>({
        team: 'all',
        component: 'all',
        severity: 'all',
        state: 'all',
        environment: 'all',
        search: ''
    });
    const [selectedAlert, setSelectedAlert] = useState<AlertRule | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingAlert, setEditingAlert] = useState<AlertRule | null>(null);
    const [duplicatingAlert, setDuplicatingAlert] = useState<AlertRule | null>(null);

    const filteredAlerts = mockAlertRules.filter(alert => {
        if (filters.team !== 'all' && alert.team !== filters.team) return false;
        if (filters.component !== 'all' && alert.component !== filters.component) return false;
        if (filters.severity !== 'all' && alert.severity !== filters.severity) return false;
        if (filters.state !== 'all' && alert.state !== filters.state) return false;
        if (filters.environment !== 'all' && alert.environment !== filters.environment) return false;
        if (filters.search && !alert.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    });

    const getAvailableComponents = () => {
        if (filters.team === 'all') return mockComponents;
        return mockComponents.filter(comp => comp.team === filters.team);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'destructive';
            case 'warning': return 'warning';
            case 'info': return 'secondary';
            default: return 'secondary';
        }
    };

    const getStateColor = (state: string) => {
        switch (state) {
            case 'firing': return 'destructive';
            case 'pending': return 'warning';
            case 'inactive': return 'secondary';
            default: return 'secondary';
        }
    };

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    const getAlertEvents = (alertId: string) => {
        return mockAlertEvents.filter(event => event.alertId === alertId);
    };

    const getAlertSilences = (alertId: string) => {
        return mockSilences.filter(silence => silence.alertId === alertId && silence.active);
    };

    const handleEdit = (alert: AlertRule) => {
        setEditingAlert(alert);
        setShowCreateDialog(true);
    };

    const handleDuplicate = (alert: AlertRule) => {
        setDuplicatingAlert(alert);
        setShowCreateDialog(true);
    };

    const handleCloseDialog = () => {
        setShowCreateDialog(false);
        setEditingAlert(null);
        setDuplicatingAlert(null);
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filters:</span>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search alerts..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-48"
                                />
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground">Team</Label>
                                <Select value={filters.team} onValueChange={(value) => setFilters({ ...filters, team: value, component: 'all' })}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Teams</SelectItem>
                                        {mockTeams.map(team => (
                                            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground">Component</Label>
                                <Select value={filters.component} onValueChange={(value) => setFilters({ ...filters, component: value })}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Components</SelectItem>
                                        {getAvailableComponents().map(comp => (
                                            <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground">Severity</Label>
                                <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                        <SelectItem value="warning">Warning</SelectItem>
                                        <SelectItem value="info">Info</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground">State</Label>
                                <Select value={filters.state} onValueChange={(value) => setFilters({ ...filters, state: value })}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="firing">Firing</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground">Environment</Label>
                                <Select value={filters.environment} onValueChange={(value) => setFilters({ ...filters, environment: value })}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="live">Live</SelectItem>
                                        <SelectItem value="canary">Canary</SelectItem>
                                        <SelectItem value="staging">Staging</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Alerts Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Alert Rules ({filteredAlerts.length})
                        </div>
                        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create Alert
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div>
                        {/* Header */}
                        <div className="grid grid-cols-12 px-4 py-3 border-b bg-muted/30 text-sm font-medium">
                            <div className="col-span-3">Alert Name</div>
                            <div className="col-span-2">Team / Component</div>
                            <div className="col-span-1">Severity</div>
                            <div className="col-span-1">State</div>
                            <div className="col-span-1">Environment</div>
                            <div className="col-span-2">Last Triggered</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>

                        {/* Alert Rows */}
                        {filteredAlerts.map((alert) => (
                            <div key={alert.id} className="grid grid-cols-12 px-4 py-3 border-b hover:bg-slate-50/70 text-sm items-center">
                                <div className="col-span-3 truncate font-medium cursor-pointer">{alert.name}</div>
                                <div className="col-span-2 truncate text-slate-600">
                                    {mockTeams.find(t => t.id === alert.team)?.name} / {mockComponents.find(c => c.id === alert.component)?.name}
                                </div>
                                <div className="col-span-1">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                            alert.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
                                                'bg-blue-100 text-blue-800'
                                        }`}>
                                        {alert.severity}
                                    </span>
                                </div>
                                <div className="col-span-1">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${alert.state === 'firing' ? 'bg-rose-100 text-rose-800' :
                                            alert.state === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {alert.state}
                                    </span>
                                </div>
                                <div className="col-span-1">
                                    <span className="inline-flex px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                                        {alert.environment}
                                    </span>
                                </div>
                                <div className="col-span-2 text-slate-600">
                                    {alert.lastTriggered ? new Date(alert.lastTriggered).toLocaleString() : 'Never'}
                                </div>
                                <div className="col-span-2 flex justify-end gap-2">
                                    <Drawer>
                                        <DrawerTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedAlert(alert)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </DrawerTrigger>
                                        <DrawerContent>
                                            <DrawerHeader>
                                                <DrawerTitle className="flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                                                    {selectedAlert?.name}
                                                </DrawerTitle>
                                                <DrawerDescription>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {selectedAlert && (
                                                            <>
                                                                <Badge variant={getSeverityColor(selectedAlert.severity) as any}>
                                                                    {selectedAlert.severity}
                                                                </Badge>
                                                                <Badge variant={getStateColor(selectedAlert.state) as any}>
                                                                    {selectedAlert.state}
                                                                </Badge>
                                                                <Badge variant="secondary">{selectedAlert.environment}</Badge>
                                                                <Badge variant="secondary">{mockTeams.find(t => t.id === selectedAlert.team)?.name}</Badge>
                                                                <Badge variant="secondary">{mockComponents.find(c => c.id === selectedAlert.component)?.name}</Badge>
                                                            </>
                                                        )}
                                                    </div>
                                                </DrawerDescription>
                                            </DrawerHeader>

                                            {selectedAlert && (
                                                <div className="p-4 grid md:grid-cols-3 gap-4">
                                                    {/* Chart - Main Area */}
                                                    <Card className="md:col-span-2">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-sm">Last 12h: firing intensity</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="h-40">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <LineChart data={[
                                                                        { time: '00:00', value: 0.2 },
                                                                        { time: '02:00', value: 0.4 },
                                                                        { time: '04:00', value: 0.1 },
                                                                        { time: '06:00', value: 0.6 },
                                                                        { time: '08:00', value: 0.3 },
                                                                        { time: '10:00', value: 0.8 },
                                                                        { time: '12:00', value: 0.5 },
                                                                    ]}>
                                                                        <CartesianGrid strokeDasharray="3 3" />
                                                                        <XAxis dataKey="time" />
                                                                        <YAxis />
                                                                        <Line type="monotone" dataKey="value" stroke="#3182bd" strokeWidth={2} />
                                                                    </LineChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </CardContent>
                                                    </Card>

                                                    {/* Stats */}
                                                    <Card>
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-sm">Stats</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="text-sm grid grid-cols-2 gap-y-2">
                                                            <div className="text-slate-500">Fires (7d)</div>
                                                            <div>0</div>
                                                            <div className="text-slate-500">Fires (30d)</div>
                                                            <div>8</div>
                                                            <div className="text-slate-500">Avg duration</div>
                                                            <div>56m</div>
                                                            <div className="text-slate-500">MTTA</div>
                                                            <div>2990m</div>
                                                            <div className="text-slate-500">MTTR</div>
                                                            <div>2993m</div>
                                                        </CardContent>
                                                    </Card>

                                                    {/* Rule (PromQL) */}
                                                    <Card className="md:col-span-2">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-sm">Rule (PromQL)</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <pre className="bg-slate-950 text-slate-100 p-3 rounded-xl overflow-auto text-xs">
                                                                <code>{selectedAlert.query}</code>
                                                            </pre>
                                                            <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                                                                <div>
                                                                    <div className="text-slate-500 mb-1">Labels</div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {Object.entries(selectedAlert.labels).map(([key, value]) => (
                                                                            <Badge key={key} variant="outline" className="text-foreground">
                                                                                {key}: {value}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-slate-500 mb-1">Annotations</div>
                                                                    <div className="space-y-1">
                                                                        {Object.entries(selectedAlert.annotations).map(([key, value]) => (
                                                                            <div key={key}>
                                                                                <strong>{key}</strong>: {key === 'runbook_url' ? (
                                                                                    <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                                                                                        runbook
                                                                                    </a>
                                                                                ) : value}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>

                                                    {/* History */}
                                                    <Card>
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-sm flex items-center gap-2">
                                                                <History className="h-4 w-4" />
                                                                History
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="max-h-52 overflow-auto text-sm">
                                                            {getAlertEvents(selectedAlert.id).slice(0, 8).map((event, index) => (
                                                                <div key={event.id} className="flex items-center justify-between py-1 border-b last:border-0">
                                                                    <span>{new Date(event.timestamp).toLocaleString()}</span>
                                                                    <span className="text-slate-500">
                                                                        → {new Date(event.timestamp + event.duration).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </CardContent>
                                                    </Card>

                                                    {/* Silences */}
                                                    <Card>
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-sm">Silences</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="text-sm space-y-2">
                                                            {getAlertSilences(selectedAlert.id).length > 0 ? (
                                                                getAlertSilences(selectedAlert.id).map((silence) => (
                                                                    <div key={silence.id} className="flex items-center justify-between border rounded-lg p-2">
                                                                        <div>
                                                                            <div>By {silence.createdBy.split('@')[0]}</div>
                                                                            <div className="text-slate-500 text-xs">
                                                                                until {new Date(silence.endsAt).toLocaleString()}
                                                                            </div>
                                                                        </div>
                                                                        <Button variant="outline" size="sm" className="text-xs">
                                                                            Cancel
                                                                        </Button>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <>
                                                                    <Button variant="secondary" size="sm" className="w-full text-xs">
                                                                        Create silence (2h)
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            )}
                                        </DrawerContent>
                                    </Drawer>

                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(alert)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>

                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleDuplicate(alert)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAlert ? 'Edit Alert Rule' : duplicatingAlert ? 'Duplicate Alert Rule' : 'Create Alert Rule'}
                        </DialogTitle>
                    </DialogHeader>
                    <CreateAlertWizard
                        onClose={handleCloseDialog}
                        initialData={editingAlert || duplicatingAlert}
                        mode={editingAlert ? 'edit' : duplicatingAlert ? 'duplicate' : 'create'}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}