import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit,
  Copy,
  RefreshCw,
  Terminal,
  MoreVertical,
  Eye,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Mock data structure similar to the DESK tool
const mockResourceData = {
  "OrderSet": [
    {
      name: "order-set-dev-123",
      path: "/ic-automotive-order/order-set-dev-123",
      namespace: "automotive-dev",
      status: "Active",
      created: "2024-12-15T10:30:00Z",
      spec: {
        apiVersion: "order.resource.api.sap/v1",
        kind: "OrderSet",
        metadata: {
          name: "order-set-dev-123",
          namespace: "automotive-dev",
          annotations: {
            "order/last-applied-configuration": "{'apiVersion':'order.resource.api.sap/v1'}"
          },
          creationTime: "2024-12-15T10:30:00Z"
        },
        spec: {
          orderId: "OS-DEV-123456",
          customerInfo: {
            customerId: "CUST-001",
            region: "EU",
            tier: "Premium"
          },
          items: [
            { productId: "PROD-001", quantity: 5, unitPrice: 199.99 },
            { productId: "PROD-002", quantity: 2, unitPrice: 299.99 }
          ],
          totalAmount: 1599.93,
          currency: "EUR",
          status: "PROCESSING"
        },
        status: {
          conditions: [
            {
              type: "Ready",
              status: "True",
              lastTransitionTime: "2024-12-15T10:35:00Z"
            }
          ]
        }
      }
    },
    {
      name: "order-set-staging-456",
      path: "/ic-automotive-order/order-set-staging-456",
      namespace: "automotive-staging",
      status: "Pending",
      created: "2024-12-15T11:45:00Z",
      spec: {
        apiVersion: "order.resource.api.sap/v1",
        kind: "OrderSet",
        metadata: {
          name: "order-set-staging-456",
          namespace: "automotive-staging"
        },
        spec: {
          orderId: "OS-STG-456789",
          customerInfo: {
            customerId: "CUST-002",
            region: "NA",
            tier: "Standard"
          },
          items: [
            { productId: "PROD-003", quantity: 1, unitPrice: 99.99 }
          ],
          totalAmount: 99.99,
          currency: "USD",
          status: "PENDING_APPROVAL"
        }
      }
    }
  ],
  "OrgContext": [
    {
      name: "org-context-eu-central",
      path: "/ic-automotive-org/org-context-eu-central",
      namespace: "org-management",
      status: "Active",
      created: "2024-12-14T09:00:00Z",
      spec: {
        apiVersion: "org.resource.api.sap/v1",
        kind: "OrgContext",
        metadata: {
          name: "org-context-eu-central",
          namespace: "org-management"
        },
        spec: {
          organizationId: "ORG-EU-001",
          region: "eu-central-1",
          accountStructure: {
            parentAccount: "SAP-CORP",
            subAccounts: ["SAP-EU-DEV", "SAP-EU-PROD"]
          },
          compliance: {
            gdprCompliant: true,
            dataResidency: "EU"
          }
        }
      }
    }
  ],
  "Organization": [
    {
      name: "sap-automotive-corp",
      path: "/ic-automotive-quality/sap-automotive-corp",
      namespace: "corporate",
      status: "Active",
      created: "2024-12-10T08:00:00Z",
      spec: {
        apiVersion: "org.resource.api.sap/v1",
        kind: "Organization",
        metadata: {
          name: "sap-automotive-corp",
          namespace: "corporate"
        },
        spec: {
          displayName: "SAP Automotive Corporation",
          orgType: "ENTERPRISE",
          domains: ["sap-automotive.com", "automotive.sap.com"],
          administrativeContacts: [
            {
              role: "PRIMARY_ADMIN",
              email: "admin@sap-automotive.com"
            }
          ]
        }
      }
    }
  ],
  "OrganizationBase": [
    {
      name: "org-base-global",
      path: "/sanity-e2e-test-provider/org-base-global",
      namespace: "global-config",
      status: "Active",
      created: "2024-12-12T12:00:00Z",
      spec: {
        apiVersion: "org.resource.api.sap/v1",
        kind: "OrganizationBase",
        metadata: {
          name: "org-base-global",
          namespace: "global-config"
        },
        spec: {
          baseConfiguration: {
            defaultRegion: "eu-central-1",
            supportedRegions: ["eu-central-1", "us-east-1", "ap-southeast-1"],
            defaultCurrency: "EUR",
            timezone: "UTC"
          },
          policies: {
            dataRetention: "7_YEARS",
            backupFrequency: "DAILY"
          }
        }
      }
    }
  ],
  "OrgnameespacemanagerTenant": [
    {
      name: "tenant-mgr-automotive-dev",
      path: "/clm/tenant-mgr-automotive-dev",
      namespace: "tenant-management",
      status: "Active",
      created: "2024-12-13T14:30:00Z",
      spec: {
        apiVersion: "tenant.resource.api.sap/v1",
        kind: "OrgnameespacemanagerTenant",
        metadata: {
          name: "tenant-mgr-automotive-dev",
          namespace: "tenant-management"
        },
        spec: {
          tenantId: "TENANT-AUTO-DEV-001",
          managedNamespaces: [
            "automotive-dev",
            "automotive-dev-data",
            "automotive-dev-config"
          ],
          resourceQuotas: {
            cpu: "4000m",
            memory: "8Gi",
            storage: "100Gi"
          },
          securityContext: {
            runAsNonRoot: true,
            seccompProfile: "runtime/default"
          }
        }
      }
    }
  ]
};

interface Resource {
  name: string;
  path: string;
  namespace: string;
  status: string;
  created: string;
  spec: any;
}

interface TreeNode {
  name: string;
  type: 'folder' | 'resource';
  path: string;
  children?: TreeNode[];
  resource?: Resource;
  expanded?: boolean;
}

const DeskResourceManager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  // Build tree structure from mock data
  const treeData = useMemo(() => {
    const tree: TreeNode[] = [];
    
    Object.entries(mockResourceData).forEach(([resourceType, resources]) => {
      const typeNode: TreeNode = {
        name: resourceType,
        type: 'folder',
        path: `/${resourceType.toLowerCase()}`,
        children: [],
        expanded: expandedNodes.has(resourceType)
      };

      resources.forEach((resource) => {
        const parts = resource.path.split('/').filter(Boolean);
        let currentLevel = typeNode.children!;
        let currentPath = `/${resourceType.toLowerCase()}`;

        parts.forEach((part, index) => {
          currentPath += `/${part}`;
          const isLast = index === parts.length - 1;
          
          let existingNode = currentLevel.find(node => node.name === part);
          
          if (!existingNode) {
            existingNode = {
              name: part,
              type: isLast ? 'resource' : 'folder',
              path: currentPath,
              children: isLast ? undefined : [],
              resource: isLast ? resource : undefined,
              expanded: expandedNodes.has(currentPath)
            };
            currentLevel.push(existingNode);
          }
          
          if (!isLast && existingNode.children) {
            currentLevel = existingNode.children;
          }
        });
      });

      tree.push(typeNode);
    });

    return tree;
  }, [expandedNodes]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return treeData;
    
    const filterTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce((acc: TreeNode[], node) => {
        if (node.type === 'resource' && 
            (node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             node.resource?.namespace.toLowerCase().includes(searchQuery.toLowerCase()))) {
          acc.push(node);
        } else if (node.children) {
          const filteredChildren = filterTree(node.children);
          if (filteredChildren.length > 0) {
            acc.push({
              ...node,
              children: filteredChildren,
              expanded: true
            });
          }
        }
        return acc;
      }, []);
    };

    return filterTree(treeData);
  }, [treeData, searchQuery]);

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const selectResource = (resource: Resource, type: string) => {
    setSelectedResource(resource);
    setSelectedType(type);
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const paddingLeft = level * 20;
    
    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-muted/50 cursor-pointer ${
            selectedResource?.name === node.name ? 'bg-muted' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleNode(node.path);
            } else if (node.resource) {
              const resourceType = Object.keys(mockResourceData).find(type =>
                mockResourceData[type as keyof typeof mockResourceData].includes(node.resource!)
              );
              if (resourceType) {
                selectResource(node.resource, resourceType);
              }
            }
          }}
        >
          {node.type === 'folder' && (
            <>
              {node.expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {node.expanded ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )}
            </>
          )}
          {node.type === 'resource' && (
            <>
              <div className="w-4" />
              <File className="h-4 w-4 text-green-500" />
            </>
          )}
          <span className="text-sm font-mono">{node.name}</span>
          {node.resource && (
            <Badge variant="outline" className="ml-auto text-xs">
              {node.resource.status}
            </Badge>
          )}
        </div>
        
        {node.type === 'folder' && node.expanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderResourceDetails = () => {
    if (!selectedResource) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a resource to view details</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold font-mono">{selectedResource.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedType}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={selectedResource.status === 'Active' ? 'default' : 'secondary'}>
              {selectedResource.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  Describe
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to clipboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Metadata</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Namespace:</span>
                  <p className="font-mono">{selectedResource.namespace}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-mono">{new Date(selectedResource.created).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Path:</span>
                  <p className="font-mono break-all">{selectedResource.path}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-2">Resource Specification</h4>
              <pre className="bg-muted/50 p-4 rounded-lg text-xs overflow-auto font-mono">
                {JSON.stringify(selectedResource.spec, null, 2)}
              </pre>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="h-[600px] border rounded-lg bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          <h2 className="text-lg font-semibold">DESK - Resource Manager</h2>
          <Badge variant="outline" className="text-xs">
            v1.0.0-sap-01-2025-08-10-214949
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedResource(null)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100%-73px)]">
        {/* Left Panel - Resource Tree */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                className="pl-10 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredData.map(node => renderTreeNode(node))}
            </div>
          </ScrollArea>
          
          {/* Footer Commands */}
          <div className="border-t bg-muted/10 p-2">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground font-mono">
              <span>&lt;Ctrl-D&gt; Delete</span>
              <span>&lt;Ctrl-J&gt; Show as JSON</span>
              <span>&lt;Ctrl-E&gt; Show events</span>
              <span>&lt;Ctrl-K&gt; Edit</span>
              <span>&lt;Tab&gt; Cycle focus</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Resource Details */}
        <div className="w-1/2">
          {renderResourceDetails()}
        </div>
      </div>
    </div>
  );
};

export default DeskResourceManager;