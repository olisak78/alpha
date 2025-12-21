import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCentralLandscapes, type LandscapeInfo } from '@/services/Ops2goApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BreadcrumbPage } from '@/components/BreadcrumbPage';
import { Search, AlertTriangle, ExternalLink, Server, Github, Cloud, Gauge, FileText, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Ops2goPageProps {
  projectId: string;
  projectName: string;
}

export default function Ops2goPage({ projectId, projectName }: Ops2goPageProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ops2go-central-landscapes'],
    queryFn: fetchCentralLandscapes,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Extract unique types
  const types = useMemo(() => {
    if (!data?.data) return [];
    const typeSet = new Set<string>();
    Object.values(data.data).forEach(landscape => {
      if (landscape.type) {
        typeSet.add(landscape.type);
      }
    });
    return Array.from(typeSet).sort();
  }, [data]);

  // Convert data to array for filtering
  const landscapesArray = useMemo(() => {
    if (!data?.data) return [];
    return Object.entries(data.data).map(([name, info]) => ({
      name,
      ...info
    }));
  }, [data]);

  // Filter landscapes
  const filteredLandscapes = useMemo(() => {
    return landscapesArray.filter(landscape => {
      // Type filter
      if (selectedType !== 'all' && landscape.type !== selectedType) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          landscape.name.toLowerCase().includes(searchLower) ||
          landscape.description?.toLowerCase().includes(searchLower) ||
          landscape.domain?.toLowerCase().includes(searchLower) ||
          landscape.owner?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [landscapesArray, selectedType, searchTerm]);

  const getTypeColor = (type?: string) => {
    if (!type) return "bg-slate-500/10 text-slate-700 dark:text-slate-300";
    const t = type.toLowerCase();
    if (t === "aws") return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
    if (t === "ali") return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (t === "azure") return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400";
    if (t === "gcp") return "bg-green-500/10 text-green-600 dark:text-green-400";
    return "bg-slate-500/10 text-slate-700 dark:text-slate-300";
  };

  const IconLink = ({
    url,
    icon: Icon,
    tooltip
  }: {
    url?: string;
    icon: React.ElementType;
    tooltip: string;
  }) => {
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-accent transition-colors group relative"
        title={tooltip}
      >
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </a>
    );
  };

  if (error) {
    return (
      <BreadcrumbPage>
        <div className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load Ops2go data: {(error as Error).message}</span>
          </div>
        </div>
      </BreadcrumbPage>
    );
  }

  if (isLoading) {
    return (
      <BreadcrumbPage>
        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Loading central landscapes from Ops2go...
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </BreadcrumbPage>
    );
  }

  return (
    <BreadcrumbPage>
      <div className="p-6 space-y-4">
        {/* Header Section */}
        <div className="border-b border-border pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Server className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Central Landscapes (Ops2go)</h2>
              <Badge variant="secondary" className="text-sm px-2.5 py-0.5">
                {filteredLandscapes.length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-3 flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          {/* Search */}
          <div className="relative w-full lg:w-80 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search landscapes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 bg-muted/50 h-9"
            />
          </div>

          {/* Type Filters */}
          {types.length > 0 && (
            <>
              <div className="hidden lg:block w-px h-8 bg-border flex-shrink-0" />
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedType('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                    selectedType === 'all'
                      ? "bg-primary text-primary-foreground shadow-sm scale-105"
                      : "bg-gray-50 hover:bg-gray-100 text-muted-foreground border border-border/90 hover:border-border hover:scale-105 dark:bg-gray-800/50 dark:hover:bg-gray-700/70 dark:text-gray-300 dark:border-gray-600/50"
                  )}
                >
                  All Types
                </button>
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(selectedType === type ? 'all' : type)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                      selectedType === type
                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                        : "bg-gray-50 hover:bg-gray-100 text-muted-foreground border border-border/90 hover:border-border hover:scale-105 dark:bg-gray-800/50 dark:hover:bg-gray-700/70 dark:text-gray-300 dark:border-gray-600/50"
                    )}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Landscapes Table */}
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b">
                <tr className="text-sm font-medium">
                  <th className="px-4 py-3 text-left">Landscape</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Domain</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Jumpbox</th>
                  <th className="px-4 py-3 text-left">Links</th>
                </tr>
              </thead>
              <tbody>
                {filteredLandscapes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No landscapes found</p>
                    </td>
                  </tr>
                ) : (
                  filteredLandscapes.map((landscape) => (
                    <tr
                      key={landscape.name}
                      className="border-b hover:bg-muted/50 text-sm transition-colors"
                    >
                      {/* Landscape Name */}
                      <td className="px-4 py-3 font-medium">
                        {landscape.name}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        {landscape.type && (
                          <Badge className={`text-xs ${getTypeColor(landscape.type)}`}>
                            {landscape.type.toUpperCase()}
                          </Badge>
                        )}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {landscape.description || '-'}
                      </td>

                      {/* Domain */}
                      <td className="px-4 py-3 font-mono text-xs">
                        {landscape.domain || '-'}
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {landscape.owner || '-'}
                      </td>

                      {/* Jumpbox */}
                      <td className="px-4 py-3 font-mono text-xs">
                        {landscape.jumpbox || '-'}
                      </td>

                      {/* Links */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          <IconLink
                            url={landscape['landscape-repository']}
                            icon={Github}
                            tooltip="GitHub Repository"
                          />
                          <IconLink
                            url={landscape['IaaS-console']}
                            icon={Cloud}
                            tooltip="IaaS Console"
                          />
                          <IconLink
                            url={landscape['cam-profile-devod']}
                            icon={FileText}
                            tooltip="CAM Profile"
                          />
                          <IconLink
                            url={landscape.cockpit}
                            icon={Gauge}
                            tooltip="Cockpit"
                          />
                          {!landscape['IaaS-console'] &&
                           !landscape['landscape-repository'] &&
                           !landscape['cam-profile-devod'] &&
                           !landscape.cockpit && (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        {data && (
          <div className="text-xs text-muted-foreground flex items-center gap-4">
            <span>Response time: {data.responseTime}ms</span>
            <span>•</span>
            <span>Total landscapes: {Object.keys(data.data).length}</span>
          </div>
        )}
      </div>
    </BreadcrumbPage>
  );
}
