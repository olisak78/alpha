import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Users, Wrench, Home, Link, Network, Brain, MessageSquare, Puzzle } from 'lucide-react';
import { useSidebarState } from '@/contexts/SidebarContext';
import { useProjectVisibility } from '@/hooks/useProjectVisibility';
import { CloudAutomationIcon } from '../icons/CloudAutomationIcon';
import { UnifiedServicesIcon } from '../icons/UnifiedServiceIcon';
import { buildJiraFeedbackUrl } from '@/lib/utils';
import { useProjectsContext } from '@/contexts/ProjectsContext';

interface SideBarProps {
    activeProject: string;
    onProjectChange: (project: string) => void;
    projects?: string[];
}

// Default visibility for cis20, usrv, and ca 
const DEFAULT_VISIBLE_PROJECTS = ['cis20', 'usrv', 'ca'];

// Map project name to icon
const getProjectIcon = (project: string, projectsData) => {
    switch (project) {
        case 'Home': return <Home size={16} />;
        case 'Teams': return <Users size={16} />;
        case 'Self Service': return <Wrench size={16} />;
        case 'Links': return <Link size={16} />;
      //  case 'Plugins': return <Puzzle size={16} />;
        case 'AI Arena': return <Brain size={16} />;
        default: break;
    }

    const dynamicProject = projectsData.find(p => p.name === project || p.title === project);
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

export const SideBar: React.FC<SideBarProps> = ({ activeProject, onProjectChange, projects }) => {
    const { isExpanded, setIsExpanded } = useSidebarState();
    const { projects: projectsData, isLoading, sidebarItems } = useProjectsContext();
    const { isProjectVisible } = useProjectVisibility();
    const [visibilityKey, setVisibilityKey] = useState(0);

    // Listen for visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            setVisibilityKey(prev => prev + 1);
        };

        window.addEventListener('projectVisibilityChanged', handleVisibilityChange);
        return () => {
            window.removeEventListener('projectVisibilityChanged', handleVisibilityChange);
        };
    }, []);

    // Function to determine if a project should be visible in the sidebar based on visibility rules
    const isProjectVisibleInSidebar = (project: string, projectsData: any[]) => {
        // Static projects (always show)
        const staticProjects = ['Home', 'Teams', 'Self Service', 'Links', 'Plugins', 'AI Arena'];
        if (staticProjects.includes(project)) {
            return true;
        }
        
        // For dynamic projects, use the visibility hook
        const dynamicProject = projectsData.find(p => p.name === project || p.title === project);
        if (dynamicProject) {
            return isProjectVisible(dynamicProject);
        }
        
        return false;
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
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="absolute top-4 -right-3 z-50 flex items-center justify-center w-6 h-6 rounded-full bg-accent/80 dark:bg-accent border-2 border-border shadow-md hover:shadow-lg transition-all duration-200 hover:bg-accent hover:brightness-90 dark:hover:brightness-125 text-foreground dark:text-foreground"
                    aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                <nav className="flex flex-col justify-between h-full py-3">
                    <div className="flex flex-col gap-1 px-2">
                        {sidebarItems?.filter((project) => isProjectVisibleInSidebar(project, projectsData)).map((project) => (
                            <button
                                key={project}
                                onClick={() => onProjectChange(project)}
                                className={`group relative flex items-center transition-all duration-200 w-full rounded-md px-2 py-1.5 ${activeProject === project ? 'font-medium' : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'}`}
                                title={!isExpanded ? project : undefined}
                            >
                                <div className={`flex items-center justify-center flex-shrink-0 h-7 w-7 rounded-full transition-colors duration-200 ${activeProject === project ? 'bg-blue-500 text-white dark:bg-blue-600' : 'bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground'}`}>
                                    <div className="flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                                        {getProjectIcon(project, projectsData)}
                                    </div>
                                </div>
                                <span className={`ml-3 text-sm font-medium truncate transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}`}>
                                    {project}
                                </span>
                            </button>
                        ))}
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
                            <span className={`ml-2.5 text-xs font-medium truncate transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}`}>
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
