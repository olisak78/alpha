import React from 'react';
import { User, Users, Server, Cloud, Settings, Wrench, Home, Link, Brain } from 'lucide-react';

export interface CollapsedSidebarProps {
    activeProject: string;
    projects: string[];
    onProjectChange: (project: string) => void;
}

export const CollapsedSidebar: React.FC<CollapsedSidebarProps> = ({ 
    activeProject, 
    projects, 
    onProjectChange 
}) => {
    // Map projects to their corresponding icons
    const getProjectIcon = (project: string) => {
        switch (project) {
            case 'Me':
                return <User size={18} />;
            case 'Teams':
                return <Users size={18} />;
            case 'CIS@2.0':
                return <Server size={18} />;
            case 'Cloud Automation':
                return <Cloud size={18} />;
            case 'Unified Services':
                return <Settings size={18} />;
            case 'Self Service':
                return <Wrench size={18} />;
            case 'Links':
                return <Link size={18} />;
            case 'AI Launchpad':
                return <Brain size={18} />;
            default:
                return <Home size={18} />;
        }
    };

    return (
        <div className="w-full h-full bg-background text-foreground transition-all duration-200 ease-out shrink-0 border-r border-border rounded-r-xl">
            {/* Spacer to align with header height */}
            <div className='h-[var(--header-height,6rem)]'></div>
            <nav className="px-2 py-3 transition-all duration-150 ease-out px-3">
                <div>
                    {projects.map((project) => (
                        <button
                            key={project}
                            onClick={() => onProjectChange(project)}
                            className={`w-full rounded-lg mb-1 transition-all duration-150 ease-out text-foreground relative overflow-hidden px-3 py-2 ${
                                activeProject === project
                                    ? "bg-primary text-primary-foreground font-medium"
                                    : "hover:bg-accent hover:text-accent-foreground"
                            }`}
                            title={project}
                        >
                            <div className="flex items-center justify-center h-5">
                                {getProjectIcon(project)}
                            </div>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};
