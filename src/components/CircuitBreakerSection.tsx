import { useState } from "react";
import { Shield, ChevronDown, ChevronRight, Activity, TrendingUp, TrendingDown, Zap, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ComponentHealth } from "@/types/health";

interface CircuitBreakerSectionProps {
    circuitBreakers: ComponentHealth;
}

interface CircuitBreakerDetails {
    bufferedCalls: number;
    failedCalls: number;
    failureRate: string;
    failureRateThreshold: string;
    notPermittedCalls: number;
    slowCallRate: string;
    slowCallRateThreshold: string;
    slowCalls: number;
    slowFailedCalls: number;
    state: string;
}

export function CircuitBreakerSection({ circuitBreakers }: CircuitBreakerSectionProps) {
    const [expandedCircuitBreakers, setExpandedCircuitBreakers] = useState<Set<string>>(new Set());

    const toggleCircuitBreaker = (name: string) => {
        setExpandedCircuitBreakers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(name)) {
                newSet.delete(name);
            } else {
                newSet.add(name);
            }
            return newSet;
        });
    };

    const StatusDot = ({ status }: { status?: string }) => {
        const getStatusDisplay = (status?: string) => {
            if (!status) return { dotColor: "bg-gray-400", shouldAnimate: false };

            switch (status.toUpperCase()) {
                case 'UP':
                    return { dotColor: "bg-green-500", shouldAnimate: true };
                case 'DOWN':
                    return { dotColor: "bg-red-500", shouldAnimate: true };
                default:
                    return { dotColor: "bg-yellow-500", shouldAnimate: false };
            }
        };

        const { dotColor, shouldAnimate } = getStatusDisplay(status);
        return (
            <span className="relative flex h-2 w-2">
                {shouldAnimate && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
            </span>
        );
    };

    // Get state badge variant
    const getStateBadge = (state: string) => {
        switch (state) {
            case 'CLOSED':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs font-medium">Closed</Badge>;
            case 'OPEN':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs font-medium">Open</Badge>;
            case 'HALF_OPEN':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs font-medium">Half Open</Badge>;
            default:
                return <Badge variant="outline" className="text-xs">{state}</Badge>;
        }
    };

    // Parse rate value (remove % and convert to number)
    const parseRate = (rate: string): number => {
        return parseFloat(rate.replace('%', ''));
    };

    // Get rate color
    const getRateColor = (rate: string, threshold: string): string => {
        const rateValue = parseRate(rate);
        const thresholdValue = parseRate(threshold);
        
        if (rateValue === -1) return "text-muted-foreground";
        if (rateValue === 0) return "text-green-600";
        if (rateValue >= thresholdValue) return "text-red-600";
        return "text-yellow-600";
    };

    // Get metric card color based on value
    const getMetricColor = (value: number, type: 'calls' | 'failures') => {
        if (type === 'failures') {
            return value > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50';
        }
        return 'border-blue-200 bg-blue-50';
    };

    const getMetricTextColor = (value: number, type: 'calls' | 'failures') => {
        if (type === 'failures') {
            return value > 0 ? 'text-red-700' : 'text-green-700';
        }
        return 'text-blue-700';
    };

    // THE FIX: Get circuit breakers from details property
    const circuitBreakerEntries = circuitBreakers.details && typeof circuitBreakers.details === 'object' 
        ? Object.entries(circuitBreakers.details as Record<string, ComponentHealth>)
        : [];

    const hasCircuitBreakers = circuitBreakerEntries.length > 0;

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Circuit Breakers
                    {hasCircuitBreakers && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                            {circuitBreakerEntries.length}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Overall Status */}
                <div className="flex items-center justify-between mb-6 py-3 px-4 rounded-lg border-2 bg-gradient-to-r from-muted/50 to-muted/30">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold">Overall Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusDot status={circuitBreakers.status} />
                        <span className="text-xs font-medium uppercase tracking-wide">{circuitBreakers.status}</span>
                    </div>
                </div>

                {/* Circuit Breakers List */}
                {hasCircuitBreakers ? (
                    <div className="space-y-2">
                        {circuitBreakerEntries.map(([name, health]) => {
                            const isExpanded = expandedCircuitBreakers.has(name);
                            const hasDetails = health.details && Object.keys(health.details).length > 0;
                            const details = health.details as CircuitBreakerDetails | undefined;

                            return (
                                <div key={name} className="border rounded-lg overflow-hidden transition-all hover:shadow-md">
                                    <button
                                        onClick={() => hasDetails && toggleCircuitBreaker(name)}
                                        className={`w-full flex items-center justify-between py-3 px-4 bg-card hover:bg-accent/50 transition-colors ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {hasDetails && (
                                                isExpanded ?
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> :
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            )}
                                            <Zap className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                            <span className="text-sm font-medium text-left truncate">{name}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {details?.state && getStateBadge(details.state)}
                                            <StatusDot status={health.status} />
                                        </div>
                                    </button>

                                    {isExpanded && hasDetails && details && (
                                        <div className="px-4 py-4 bg-muted/20 border-t space-y-4">
                                            {/* State and Call Summary */}
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">State:</span>
                                                {getStateBadge(details.state)}
                                            </div>

                                            {/* Key Metrics - Grid Layout */}
                                            <div>
                                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                                    Call Statistics
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                    {/* Buffered Calls */}
                                                    <div className={`rounded-lg p-3 border-2 ${getMetricColor(details.bufferedCalls, 'calls')}`}>
                                                        <div className="text-xs text-muted-foreground mb-1 font-medium">Buffered</div>
                                                        <div className={`text-xl font-bold ${getMetricTextColor(details.bufferedCalls, 'calls')}`}>
                                                            {details.bufferedCalls}
                                                        </div>
                                                    </div>

                                                    {/* Failed Calls */}
                                                    <div className={`rounded-lg p-3 border-2 ${getMetricColor(details.failedCalls, 'failures')}`}>
                                                        <div className="text-xs text-muted-foreground mb-1 font-medium">Failed</div>
                                                        <div className={`text-xl font-bold ${getMetricTextColor(details.failedCalls, 'failures')}`}>
                                                            {details.failedCalls}
                                                        </div>
                                                    </div>

                                                    {/* Slow Calls */}
                                                    <div className={`rounded-lg p-3 border-2 ${getMetricColor(details.slowCalls, 'failures')}`}>
                                                        <div className="text-xs text-muted-foreground mb-1 font-medium">Slow</div>
                                                        <div className={`text-xl font-bold ${getMetricTextColor(details.slowCalls, 'failures')}`}>
                                                            {details.slowCalls}
                                                        </div>
                                                    </div>

                                                    {/* Not Permitted */}
                                                    <div className={`rounded-lg p-3 border-2 ${getMetricColor(details.notPermittedCalls, 'failures')}`}>
                                                        <div className="text-xs text-muted-foreground mb-1 font-medium">Not Permitted</div>
                                                        <div className={`text-xl font-bold ${getMetricTextColor(details.notPermittedCalls, 'failures')}`}>
                                                            {details.notPermittedCalls}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rates Section */}
                                            <div>
                                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                                    Performance Rates
                                                </div>
                                                
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                    {/* Failure Rate */}
                                                    <div className="flex items-center justify-between bg-background px-4 py-3 rounded-lg border hover:border-primary/50 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm font-medium">Failure Rate</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-bold font-mono ${getRateColor(details.failureRate, details.failureRateThreshold)}`}>
                                                                {details.failureRate}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground font-mono">
                                                                / {details.failureRateThreshold}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Slow Call Rate */}
                                                    <div className="flex items-center justify-between bg-background px-4 py-3 rounded-lg border hover:border-primary/50 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm font-medium">Slow Call Rate</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-bold font-mono ${getRateColor(details.slowCallRate, details.slowCallRateThreshold)}`}>
                                                                {details.slowCallRate}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground font-mono">
                                                                / {details.slowCallRateThreshold}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Slow Failed Calls if present and > 0 */}
                                                {details.slowFailedCalls !== undefined && details.slowFailedCalls > 0 && (
                                                    <div className="mt-2 flex items-center justify-between bg-background px-4 py-3 rounded-lg border border-red-200">
                                                        <span className="text-sm font-medium">Slow Failed Calls</span>
                                                        <span className="text-sm font-bold font-mono text-red-600">
                                                            {details.slowFailedCalls}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No circuit breaker details available</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}