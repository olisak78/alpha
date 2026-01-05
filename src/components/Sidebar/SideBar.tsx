import React, { useState, useEffect, useMemo } from "react";
import { ChevronRight, ChevronLeft, ChevronDown, Users, Wrench, Home, Link, Network, Brain, MessageSquare, Puzzle, Store } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useProjectVisibility } from '@/hooks/useProjectVisibility';
import { CloudAutomationIcon } from '../icons/CloudAutomationIcon';
import { UnifiedServicesIcon } from '../icons/UnifiedServiceIcon';
import { buildJiraFeedbackUrl } from '@/lib/utils';
import { useProjects, useSidebarItems, useProjectsLoading } from '@/stores/projectsStore';
import { usePlugins } from '@/hooks/api/usePlugins';
import { isProduction } from '@/utils/environment';


interface SideBarProps {
    activeProject: string;
    onProjectChange: (project: string) => void;
    projects?: string[];
}

// Map project name to icon
const getProjectIcon = (project: string, projectsData: any[]) => {
    switch (project) {
        case 'Home': return <Home size={16} />;
        case 'Teams': return <Users size={16} />;
        case 'Self Service': return <Wrench size={16} />;
        case 'Links': return <Link size={16} />;
        case 'AI Arena': return <Brain size={16} />;
        case 'Plugin Marketplace': return <Store size={16} />;
        default: break;
    }

    const dynamicProject = projectsData.find((p: any) => p.name === project || p.title === project);
    if (!dynamicProject) return <Home size={16} />;

    switch (dynamicProject.name) {
        case 'cis20': return <Network size={16} />;
        case 'ca': return <CloudAutomationIcon className="h-4 w-4" />;
        case 'usrv': return <UnifiedServicesIcon className="h-4 w-4" />;
        case 'neo': return <Network size={16} />;
        case 'developer-portal': return <Wrench size={16} />;
        default: return <Network size={16} />;
    }
};

// Get plugin icon dynamically
const getPluginIcon = (iconName?: string) => {
    if (!iconName) return <Puzzle size={14} />;
    
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return <Puzzle size={14} />;
    
    return <IconComponent size={14} />;
};

export const SideBar: React.FC<SideBarProps> = ({ activeProject, onProjectChange, projects }) => {
    const isExpanded = useSidebarStore((state) => state.isExpanded);
    const toggle = useSidebarStore((state) => state.toggle);

    const projectsData = useProjects();
    const isLoading = useProjectsLoading();
    const sidebarItems = useSidebarItems();

    const { isProjectVisible } = useProjectVisibility();
    const [visibilityKey, setVisibilityKey] = useState(0);
    const [isMarketplaceExpanded, setIsMarketplaceExpanded] = useState(true);

    const { data: pluginsData } = usePlugins({
        limit: 100,
        offset: 0,
    });

    const subscribedPlugins = useMemo(() => {
        if (!pluginsData?.plugins) return [];
        
        return pluginsData.plugins
            .filter(plugin => plugin.subscribed === true)
            .map(plugin => ({
                id: plugin.id,
                name: plugin.name,
                title: plugin.title,
                slug: plugin.name.toLowerCase().replace(/\s+/g, '-'),
                icon: plugin.icon,
            }));
    }, [pluginsData]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setVisibilityKey(prev => prev + 1);
        };

        window.addEventListener('projectVisibilityChanged', handleVisibilityChange);
        return () => {
            window.removeEventListener('projectVisibilityChanged', handleVisibilityChange);
        };
    }, []);

   const isProjectVisibleInSidebar = (project: string, projectsData: any[]) => {
    // Hide Plugins in production
    if (project === 'Plugins' && isProduction()) {  // ← Fixed: isProduction()
        return false;
    }
    
    // Hide Plugin Marketplace in production (dev-only feature)
    if (project === 'Plugin Marketplace' && isProduction()) {  // ← New check
        return false;
    }
    
    const staticProjects = ['Home', 'Teams', 'Self Service', 'Links', 'Plugins', 'Plugin Marketplace', 'AI Arena'];
    if (staticProjects.includes(project)) {
        return true;
    }

        const dynamicProject = projectsData.find((p: any) => p.name === project || p.title === project);
        if (dynamicProject) {
            return isProjectVisible(dynamicProject);
        }

        return false;
    };

    const handlePluginClick = (plugin: { id: string; name: string; title: string; slug: string; icon?: string }) => {
        onProjectChange(`plugins/${plugin.slug}`);
    };

    const handleMarketplaceClick = () => {
        onProjectChange('Plugin Marketplace');
    };

    const handleMarketplaceToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMarketplaceExpanded(!isMarketplaceExpanded);
    };

    if (isLoading || !projectsData) {
        return (
            <aside className={`fixed top-0 left-0 h-screen bg-background border-r border-border ${isExpanded ? 'w-52' : 'w-16'}`}>
                <div className="p-4 text-sm text-muted-foreground">Loading projects...</div>
            </aside>
        );
    }

    if (sidebarItems.length === 0) {
        return (
            <aside className={`fixed top-0 left-0 h-screen bg-background border-r border-border ${isExpanded ? 'w-52' : 'w-16'}`}>
                <div className="p-4 text-sm text-muted-foreground">No projects available</div>
            </aside>
        );
    }

    const feedbackUrl = buildJiraFeedbackUrl({ summary: '[BUG|FeatReq] Tell Us How Can We Help!', description: '' });

    return (
        <>
            <aside
                className={`fixed top-0 left-0 h-screen bg-background border-r border-border transition-all duration-300 ease-in-out z-50 ${isExpanded ? 'w-52' : 'w-16'}`}
            >
                <button
                    onClick={toggle}
                    className="absolute top-4 -right-3 z-50 flex items-center justify-center w-6 h-6 rounded-full bg-accent/80 dark:bg-accent border-2 border-border shadow-md hover:shadow-lg transition-all duration-200 hover:bg-accent hover:brightness-90 dark:hover:brightness-125 text-foreground dark:text-foreground"
                    aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                <nav className="flex flex-col justify-between h-full py-3">
                    <div className="flex flex-col gap-1 px-2 overflow-y-auto">
                        {sidebarItems?.filter((project) => isProjectVisibleInSidebar(project, projectsData)).map((project) => {
                            if (project === 'Plugin Marketplace') {
                                return (
                                    <div key={project}>
                                        <div
                                            className={`group relative flex items-center transition-all duration-200 w-full rounded-md px-2 py-1.5 cursor-pointer ${
                                                activeProject === project ? 'font-medium' : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                                            }`}
                                            title={!isExpanded ? project : undefined}
                                        >
                                            <div
                                                onClick={handleMarketplaceClick}
                                                className="flex items-center flex-1"
                                            >
                                                <div className={`flex items-center justify-center flex-shrink-0 h-7 w-7 rounded-full transition-colors duration-200 ${
                                                    activeProject === project
                                                        ? 'bg-blue-500 text-white dark:bg-blue-600'
                                                        : 'bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground'
                                                }`}>
                                                    <div className="flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                                                        {getProjectIcon(project, projectsData)}
                                                    </div>
                                                </div>
                                                <span className={`ml-3 text-sm font-medium truncate transition-all duration-300 ${
                                                    isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 overflow-hidden'
                                                }`}>
                                                    {project}
                                                </span>
                                            </div>
                                            {isExpanded && subscribedPlugins.length > 0 && (
                                                <button
                                                    onClick={handleMarketplaceToggle}
                                                    className="ml-auto p-1 rounded hover:bg-accent/70 transition-colors"
                                                    aria-label={isMarketplaceExpanded ? "Collapse plugins" : "Expand plugins"}
                                                >
                                                    <ChevronDown
                                                        size={14}
                                                        className={`transition-transform duration-200 ${
                                                            isMarketplaceExpanded ? 'rotate-180' : ''
                                                        }`}
                                                    />
                                                </button>
                                            )}
                                        </div>
                                        
                                        {isExpanded && isMarketplaceExpanded && subscribedPlugins.length > 0 && (
                                            <div className="ml-6 mt-1 space-y-1 border-l border-border pl-3">
                                                {subscribedPlugins.map((plugin) => (
                                                    <button
                                                        key={plugin.id}
                                                        onClick={() => handlePluginClick(plugin)}
                                                        className={`group relative flex items-center transition-all duration-200 w-full rounded-md px-2 py-1 text-xs ${
                                                            activeProject === `/plugins/${plugin.slug}` 
                                                                ? 'bg-accent/70 text-accent-foreground font-medium' 
                                                                : 'text-muted-foreground hover:bg-accent/30 hover:text-accent-foreground'
                                                        }`}
                                                        title={plugin.title}
                                                    >
                                                        <div className="flex-shrink-0 mr-2">
                                                            {getPluginIcon(plugin.icon)}
                                                        </div>
                                                        <span className="truncate">
                                                            {plugin.title}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <button
                                    key={project}
                                    onClick={() => onProjectChange(project)}
                                    className={`group relative flex items-center transition-all duration-200 w-full rounded-md px-2 py-1.5 ${
                                        activeProject === project ? 'font-medium' : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                                    }`}
                                    title={!isExpanded ? project : undefined}
                                >
                                    <div className={`flex items-center justify-center flex-shrink-0 h-7 w-7 rounded-full transition-colors duration-200 ${
                                        activeProject === project 
                                            ? 'bg-blue-500 text-white dark:bg-blue-600' 
                                            : 'bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground'
                                    }`}>
                                        <div className="flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                                            {getProjectIcon(project, projectsData)}
                                        </div>
                                    </div>
                                    <span className={`ml-3 text-sm font-medium truncate transition-all duration-300 ${
                                        isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'
                                    }`}>
                                        {project}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="px-2 pb-2">
                        <button
                            onClick={() => window.open(feedbackUrl, '_blank')}
                            className="group relative flex items-center transition-all duration-200 w-full rounded-md px-2 py-1 text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                            title={!isExpanded ? 'Send Feedback' : undefined}
                        >
                            <div className="flex items-center justify-center flex-shrink-0 h-6 w-6 rounded-full transition-colors duration-200 bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground">
                                <MessageSquare size={14} />
                            </div>
                            <span className={`ml-2.5 text-xs font-medium truncate transition-all duration-300 ${
                                isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'
                            }`}>
                                Send Feedback
                            </span>
                        </button>
                    </div>
                </nav>
            </aside>
            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'w-52' : 'w-16'}`} />
        </>
    );
};