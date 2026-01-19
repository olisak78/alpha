import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCentralLandscapes } from '@/services/Ops2goApi';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ChevronDown,
  ChevronUp,
  Globe,
  User,
  Hash,
  MapPin,
  MessageSquare,
  Server,
  Network,
  Lock,
  Loader2,
  FileText,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Ops2goLandscapeInfoProps {
  landscapeName: string;
}

export function Ops2goLandscapeInfo({ landscapeName }: Ops2goLandscapeInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['ops2go-central-landscapes'],
    queryFn: fetchCentralLandscapes,
    staleTime: 300000,
    refetchInterval: 300000,
  });

  if (isLoading) {
    return (
      <div className="mt-4 p-4 rounded-lg border border-border/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span>Loading ops2go data...</span>
        </div>
      </div>
    );
  }

  if (error || !data?.data) return null;

  const landscapeInfo = data.data[landscapeName];
  if (!landscapeInfo) return null;

  const getTypeGradient = (type?: string) => {
    if (!type) return "from-slate-400 to-slate-600";
    const t = type.toLowerCase();
    if (t === "aws") return "from-orange-500 to-orange-600";
    if (t === "ali") return "from-blue-500 to-blue-600";
    if (t === "azure") return "from-cyan-500 to-cyan-600";
    if (t === "gcp") return "from-green-500 to-green-600";
    if (t === "ccee") return "from-purple-500 to-purple-600";
    return "from-slate-400 to-slate-600";
  };

  const InfoItem = ({ icon: Icon, label, value, mono = false }: {
    icon: React.ElementType;
    label: string;
    value?: string | boolean;
    mono?: boolean;
  }) => {
    if (!value && value !== false) return null;
    const displayValue = typeof value === 'boolean' ? (value ? '✓ Yes' : '✗ No') : value;

    return (
      <div className="group flex items-start gap-2.5 py-2 hover:bg-accent/30 rounded-lg px-2 -mx-2 transition-colors">
        <div className="mt-0.5 p-1.5 rounded-md bg-muted group-hover:bg-muted/80 transition-colors flex-shrink-0">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
          <div className={cn(
            "text-sm text-foreground break-words",
            mono ? "font-mono" : ""
          )}>
            {displayValue}
          </div>
        </div>
      </div>
    );
  };

  const NetworkItem = ({ label, value }: { label: string; value?: string }) => {
    if (!value) return null;
    return (
      <div className="group py-2 hover:bg-accent/30 rounded-lg px-2 -mx-2 transition-colors">
        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
        <div className="text-sm font-mono text-foreground break-all">{value}</div>
      </div>
    );
  };

  return (
    <Card className="mt-4 overflow-hidden border-border/50">
      {/* Simplified Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/30 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <Server className="h-4 w-4 text-foreground transition-colors" />
          <span className="text-sm font-bold">Ops2go Details</span>
          {landscapeInfo.type && (
            <Badge className={cn(
              "text-xs px-2 py-0.5 font-semibold text-white",
              `bg-gradient-to-r ${getTypeGradient(landscapeInfo.type)}`
            )}>
              {landscapeInfo.type.toUpperCase()}
            </Badge>
          )}
          {landscapeInfo.state && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {landscapeInfo.state}
            </Badge>
          )}
          {landscapeInfo['CE-onboarded'] !== undefined && (
            <Badge
              variant={landscapeInfo['CE-onboarded'] ? "default" : "outline"}
              className={cn(
                "text-xs px-2 py-0.5",
                landscapeInfo['CE-onboarded']
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "border-orange-500 text-orange-600 dark:text-orange-400"
              )}
            >
              CE {landscapeInfo['CE-onboarded'] ? 'Onboarded' : 'Not Onboarded'}
            </Badge>
          )}
          {landscapeInfo.displayname_full && (
            <span className="text-xs text-muted-foreground">• {landscapeInfo.displayname_full}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 pt-4 space-y-6 animate-in fade-in-50 duration-300">
          {/* 3-Column Layout: Core Info | Config | Network */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Core Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-wide">Core Info</span>
              </div>
              <div className="space-y-0.5">
                <InfoItem icon={Globe} label="Domain" value={landscapeInfo.domain} mono />
                <InfoItem icon={MapPin} label="Region" value={landscapeInfo.region} />
                <InfoItem icon={User} label="Owner" value={landscapeInfo.owner} />
                <InfoItem icon={MessageSquare} label="Slack" value={landscapeInfo['slack-channel']} />
                <InfoItem icon={Server} label="Jumpbox" value={landscapeInfo.jumpbox} mono />
                {landscapeInfo.jumpbox2 && (
                  <InfoItem icon={Server} label="Jumpbox 2" value={landscapeInfo.jumpbox2} mono />
                )}
                {landscapeInfo.jumpbox_ipv6 && (
                  <InfoItem icon={Server} label="Jumpbox IPv6" value={landscapeInfo.jumpbox_ipv6} mono />
                )}
                {landscapeInfo.jumpbox2_ipv6 && (
                  <InfoItem icon={Server} label="Jumpbox 2 IPv6" value={landscapeInfo.jumpbox2_ipv6} mono />
                )}
              </div>
            </div>

            {/* Column 2: Configuration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Hash className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-wide">Configuration</span>
              </div>
              <div className="space-y-0.5">
                <InfoItem icon={Hash} label="Account ID" value={landscapeInfo['hyperscaler-account-id']} mono />
                {landscapeInfo['hyperscaler-account-id-BS'] && (
                  <InfoItem icon={Hash} label="Account (BS)" value={landscapeInfo['hyperscaler-account-id-BS']} mono />
                )}
                {landscapeInfo['hyperscaler-account-id-CONN01'] && (
                  <InfoItem icon={Hash} label="Account (CONN)" value={landscapeInfo['hyperscaler-account-id-CONN01']} mono />
                )}
                {landscapeInfo['iaas-account-alias'] && (
                  <InfoItem icon={Hash} label="IaaS Alias" value={landscapeInfo['iaas-account-alias']} mono />
                )}
                <InfoItem icon={FileText} label="CF Linux FS" value={landscapeInfo['cflinuxfs-status']} />
                <InfoItem icon={Server} label="CCF Universe" value={landscapeInfo['ccf-universe']} />
                <InfoItem icon={Activity} label="CE Onboarded" value={landscapeInfo['CE-onboarded']} />
                <InfoItem icon={FileText} label="Trial Enabled" value={landscapeInfo['trial-enabled']} />
                <InfoItem icon={Lock} label="Private Domain" value={landscapeInfo.private_domain} />
                {landscapeInfo['workload_restrictions'] && (
                  <InfoItem icon={Lock} label="Workload" value={landscapeInfo['workload_restrictions']} />
                )}
                {landscapeInfo['access_restrictions'] && (
                  <InfoItem icon={Lock} label="Access" value={landscapeInfo['access_restrictions']} />
                )}
              </div>
            </div>

            {/* Column 3: Network IPs */}
            {(landscapeInfo['lb-ips'] || landscapeInfo['lb-ips_ipv6'] || landscapeInfo['nat-ips'] ||
              landscapeInfo['ugw-lb-ips'] || landscapeInfo['trial-nat-ips'] || landscapeInfo.dynatrace_ips ||
              landscapeInfo.ipv6_cidr_blocks) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                    <Network className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-primary uppercase tracking-wide">Network IPs</span>
                  </div>
                  <div className="space-y-0.5">
                    {landscapeInfo['lb-ips'] && <NetworkItem label="Load Balancer" value={landscapeInfo['lb-ips']} />}
                    {landscapeInfo['lb-ips_ipv6'] && <NetworkItem label="LB IPv6" value={landscapeInfo['lb-ips_ipv6']} />}
                    {landscapeInfo['nat-ips'] && <NetworkItem label="NAT IPs" value={landscapeInfo['nat-ips']} />}
                    {landscapeInfo['ugw-lb-ips'] && <NetworkItem label="UGW LB" value={landscapeInfo['ugw-lb-ips']} />}
                    {landscapeInfo['trial-nat-ips'] && <NetworkItem label="Trial NAT" value={landscapeInfo['trial-nat-ips']} />}
                    {landscapeInfo.dynatrace_ips && <NetworkItem label="Dynatrace" value={landscapeInfo.dynatrace_ips} />}
                    {landscapeInfo.ipv6_cidr_blocks && <NetworkItem label="IPv6 CIDR" value={landscapeInfo.ipv6_cidr_blocks} />}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </Card>
  );
}
