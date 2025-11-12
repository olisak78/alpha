// Mock data for monitoring/alerts system

export interface Team {
    id: string;
    name: string;
    components: string[];
}

export interface Component {
    id: string;
    name: string;
    team: string;
    environment: string[];
}

export interface Metric {
    id: string;
    name: string;
    description: string;
    type: 'counter' | 'gauge' | 'histogram';
}

export interface AlertRule {
    id: string;
    name: string;
    team: string;
    component: string;
    severity: 'info' | 'warning' | 'critical';
    state: 'firing' | 'pending' | 'inactive';
    environment: string;
    query: string;
    forDuration: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
    createdBy: string;
    createdAt: string;
    lastTriggered?: string;
    firingCount: number;
}

export interface AlertEvent {
    id: string;
    alertId: string;
    timestamp: string;
    duration: number;
    state: 'started' | 'resolved';
    labels: Record<string, string>;
}

export interface Silence {
    id: string;
    alertId: string;
    createdBy: string;
    startsAt: string;
    endsAt: string;
    comment: string;
    active: boolean;
}

export interface QueryTemplate {
    id: string;
    name: string;
    description: string;
    category: 'cpu' | 'memory' | 'network' | 'errors' | 'latency' | 'custom';
    query: string;
    severity: 'info' | 'warning' | 'critical';
}

// Mock Teams
export const mockTeams: Team[] = [
    {
        id: 'team-lior',
        name: 'Team Lior',
        components: ['accounts-service', 'billing-service', 'user-service']
    },
    {
        id: 'team-avihai',
        name: 'Team Avihai',
        components: ['notification-service', 'order-service', 'payment-service']
    },
    {
        id: 'team-platform',
        name: 'Platform Team',
        components: ['api-gateway', 'auth-service', 'config-service']
    }
];

// Mock Components
export const mockComponents: Component[] = [
    { id: 'accounts-service', name: 'Accounts Service', team: 'team-lior', environment: ['staging', 'canary', 'live'] },
    { id: 'billing-service', name: 'Billing Service', team: 'team-lior', environment: ['staging', 'live'] },
    { id: 'user-service', name: 'User Service', team: 'team-lior', environment: ['staging', 'canary', 'live'] },
    { id: 'notification-service', name: 'Notification Service', team: 'team-avihai', environment: ['staging', 'live'] },
    { id: 'order-service', name: 'Order Service', team: 'team-avihai', environment: ['staging', 'canary', 'live'] },
    { id: 'payment-service', name: 'Payment Service', team: 'team-avihai', environment: ['staging', 'live'] },
    { id: 'api-gateway', name: 'API Gateway', team: 'team-platform', environment: ['staging', 'canary', 'live'] },
    { id: 'auth-service', name: 'Auth Service', team: 'team-platform', environment: ['staging', 'live'] },
    { id: 'config-service', name: 'Config Service', team: 'team-platform', environment: ['staging', 'live'] }
];

// Mock Metrics
export const mockMetrics: Metric[] = [
    { id: 'cpu_usage_seconds_total', name: 'CPU Usage', description: 'CPU usage in seconds', type: 'counter' },
    { id: 'memory_usage_bytes', name: 'Memory Usage', description: 'Memory usage in bytes', type: 'gauge' },
    { id: 'http_request_duration_seconds', name: 'HTTP Request Duration', description: 'HTTP request duration in seconds', type: 'histogram' },
    { id: 'http_requests_total', name: 'HTTP Requests Total', description: 'Total HTTP requests', type: 'counter' },
    { id: 'request_errors_total', name: 'Request Errors', description: 'Total request errors', type: 'counter' },
    { id: 'container_restarts_total', name: 'Container Restarts', description: 'Container restart count', type: 'counter' },
    { id: 'disk_usage_bytes', name: 'Disk Usage', description: 'Disk usage in bytes', type: 'gauge' },
    { id: 'network_receive_bytes_total', name: 'Network Receive', description: 'Network bytes received', type: 'counter' }
];

// Mock Query Templates
export const mockQueryTemplates: QueryTemplate[] = [
    {
        id: 'cpu-high',
        name: 'High CPU Usage',
        description: 'CPU usage above 80% for 5 minutes',
        category: 'cpu',
        query: 'avg by (pod) (rate(container_cpu_usage_seconds_total{component="$COMP",team="$TEAM"}[5m])) > 0.8',
        severity: 'warning'
    },
    {
        id: 'memory-high',
        name: 'High Memory Usage',
        description: 'Memory usage above 90%',
        category: 'memory',
        query: 'avg by (pod) (container_memory_usage_bytes{component="$COMP",team="$TEAM"} / container_spec_memory_limit_bytes) > 0.9',
        severity: 'critical'
    },
    {
        id: 'error-rate-high',
        name: 'High Error Rate',
        description: 'Error rate above 5%',
        category: 'errors',
        query: 'sum(rate(request_errors_total{component="$COMP",team="$TEAM"}[5m])) / sum(rate(http_requests_total{component="$COMP",team="$TEAM"}[5m])) > 0.05',
        severity: 'critical'
    },
    {
        id: 'latency-p95-high',
        name: 'High P95 Latency',
        description: 'P95 latency above 500ms',
        category: 'latency',
        query: 'histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{component="$COMP",team="$TEAM"}[5m]))) > 0.5',
        severity: 'warning'
    },
    {
        id: 'pod-restarts',
        name: 'Pod Restarts Spike',
        description: 'Container restarts in the last 15 minutes',
        category: 'custom',
        query: 'increase(container_restarts_total{component="$COMP",team="$TEAM"}[15m]) > 3',
        severity: 'warning'
    }
];

// Mock Alert Rules
export const mockAlertRules: AlertRule[] = [
    {
        id: 'alert-1',
        name: 'Accounts Service High CPU',
        team: 'team-lior',
        component: 'accounts-service',
        severity: 'warning',
        state: 'firing',
        environment: 'live',
        query: 'avg by (pod) (rate(container_cpu_usage_seconds_total{component="accounts-service",team="team-lior"}[5m])) > 0.8',
        forDuration: '5m',
        labels: { severity: 'warning', team: 'team-lior', component: 'accounts-service' },
        annotations: {
            title: 'High CPU usage detected',
            description: 'CPU usage is above 80% for more than 5 minutes',
            runbook_url: 'https://runbooks.example.com/cpu-high'
        },
        createdBy: 'lior.cohen@company.com',
        createdAt: '2024-01-15T10:30:00Z',
        lastTriggered: '2024-01-16T14:22:00Z',
        firingCount: 3
    },
    {
        id: 'alert-2',
        name: 'Billing API Error Rate',
        team: 'team-lior',
        component: 'billing-service',
        severity: 'critical',
        state: 'inactive',
        environment: 'live',
        query: 'sum(rate(request_errors_total{component="billing-service",team="team-lior"}[5m])) / sum(rate(http_requests_total{component="billing-service",team="team-lior"}[5m])) > 0.05',
        forDuration: '2m',
        labels: { severity: 'critical', team: 'team-lior', component: 'billing-service' },
        annotations: {
            title: 'High error rate in billing API',
            description: 'Error rate is above 5%',
            runbook_url: 'https://runbooks.example.com/error-rate'
        },
        createdBy: 'lior.cohen@company.com',
        createdAt: '2024-01-10T09:15:00Z',
        lastTriggered: '2024-01-14T16:45:00Z',
        firingCount: 0
    },
    {
        id: 'alert-3',
        name: 'Order Service Memory Usage',
        team: 'team-avihai',
        component: 'order-service',
        severity: 'critical',
        state: 'pending',
        environment: 'live',
        query: 'avg by (pod) (container_memory_usage_bytes{component="order-service",team="team-avihai"} / container_spec_memory_limit_bytes) > 0.9',
        forDuration: '3m',
        labels: { severity: 'critical', team: 'team-avihai', component: 'order-service' },
        annotations: {
            title: 'High memory usage',
            description: 'Memory usage is above 90%',
            runbook_url: 'https://runbooks.example.com/memory-high'
        },
        createdBy: 'avihai.ben@company.com',
        createdAt: '2024-01-12T14:20:00Z',
        lastTriggered: '2024-01-16T13:30:00Z',
        firingCount: 1
    }
];

// Mock Alert Events
export const mockAlertEvents: AlertEvent[] = [
    {
        id: 'event-1',
        alertId: 'alert-1',
        timestamp: '2024-01-16T14:22:00Z',
        duration: 180000, // 3 minutes
        state: 'started',
        labels: { pod: 'accounts-service-5f7b8c9d4e-xyz12' }
    },
    {
        id: 'event-2',
        alertId: 'alert-1',
        timestamp: '2024-01-16T14:25:00Z',
        duration: 180000,
        state: 'resolved',
        labels: { pod: 'accounts-service-5f7b8c9d4e-xyz12' }
    },
    {
        id: 'event-3',
        alertId: 'alert-2',
        timestamp: '2024-01-14T16:45:00Z',
        duration: 300000, // 5 minutes
        state: 'started',
        labels: { endpoint: '/api/billing/charge' }
    },
    {
        id: 'event-4',
        alertId: 'alert-2',
        timestamp: '2024-01-14T16:50:00Z',
        duration: 300000,
        state: 'resolved',
        labels: { endpoint: '/api/billing/charge' }
    }
];

// Mock Silences
export const mockSilences: Silence[] = [
    {
        id: 'silence-1',
        alertId: 'alert-2',
        createdBy: 'lior.cohen@company.com',
        startsAt: '2024-01-16T15:00:00Z',
        endsAt: '2024-01-16T17:00:00Z',
        comment: 'Maintenance window - billing system upgrade',
        active: true
    }
];

// Mock data for charts
export const teamStatsData = [
    { team: 'Team Lior', activeRules: 8, firingRate: 15, mttr: 2.5, coverage: 85 },
    { team: 'Team Avihai', activeRules: 6, firingRate: 22, mttr: 3.2, coverage: 78 },
    { team: 'Platform Team', activeRules: 12, firingRate: 8, mttr: 1.8, coverage: 95 }
];

export const componentStatsData = [
    { component: 'accounts-service', alerts: 12, fires: 8, avgDuration: 2.5 },
    { component: 'billing-service', alerts: 6, fires: 15, avgDuration: 4.2 },
    { component: 'order-service', alerts: 8, fires: 5, avgDuration: 1.8 },
    { component: 'user-service', alerts: 10, fires: 12, avgDuration: 3.1 },
    { component: 'api-gateway', alerts: 15, fires: 3, avgDuration: 1.2 }
];

export const firingHeatmapData = [
    { hour: '00', Mon: 2, Tue: 1, Wed: 0, Thu: 1, Fri: 3, Sat: 0, Sun: 1 },
    { hour: '06', Mon: 5, Tue: 3, Wed: 4, Thu: 6, Fri: 8, Sat: 2, Sun: 1 },
    { hour: '12', Mon: 12, Tue: 15, Wed: 10, Thu: 18, Fri: 14, Sat: 5, Sun: 3 },
    { hour: '18', Mon: 8, Tue: 6, Wed: 9, Thu: 11, Fri: 7, Sat: 4, Sun: 2 }
];

export const performanceTrendData = [
    { date: '2024-01-01', mttr: 3.2, mtta: 1.5, fires: 15 },
    { date: '2024-01-08', mttr: 2.8, mtta: 1.3, fires: 12 },
    { date: '2024-01-15', mttr: 2.5, mtta: 1.2, fires: 8 },
    { date: '2024-01-22', mttr: 2.1, mtta: 1.0, fires: 6 }
];

export const severityDistribution = [
    { name: 'Critical', value: 15, color: '#ef4444' },
    { name: 'Warning', value: 35, color: '#f59e0b' },
    { name: 'Info', value: 50, color: '#6b7280' }
];

export const flappyAlerts = [
    { name: 'CPU Spike Alert', fires: 25, avgDuration: '45s', component: 'accounts-service' },
    { name: 'Memory Usage', fires: 18, avgDuration: '1m 20s', component: 'billing-service' },
    { name: 'Error Rate', fires: 12, avgDuration: '2m 15s', component: 'order-service' }
];

export const staleAlerts = [
    { name: 'Legacy DB Connection', lastFired: '90 days ago', component: 'user-service' },
    { name: 'Old API Endpoint', lastFired: '125 days ago', component: 'billing-service' }
];

export const alertGaps = [
    { component: 'payment-service', team: 'Team Avihai', criticalAlerts: 0 },
    { component: 'config-service', team: 'Platform Team', criticalAlerts: 1 }
];
