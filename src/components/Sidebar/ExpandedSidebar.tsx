import React from 'react';
import { User, Users, Server, Cloud, Settings, Wrench, Home, X, Link, Brain } from 'lucide-react';

export interface ExpandedSidebarProps {
    activeProject: string;
    projects: string[];
    onProjectChange: (project: string) => void;
    onClose?: () => void;
}

export const ExpandedSidebar: React.FC<ExpandedSidebarProps> = ({ 
    activeProject, 
    projects, 
    onProjectChange,
    onClose
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
            {/* Header with title and close button */}
            {onClose && (
                <div className="flex items-center justify-between p-3">
                    <h2 className="text-lg font-bold text-foreground">Developer Portal</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
            
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
                        >
                            <div className="flex items-center h-5">
                                <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                    {getProjectIcon(project)}
                                </div>
                                <span className="transition-all duration-150 ease-out whitespace-nowrap ml-3 opacity-100 transform scale-100 text-sm">
                                    {project}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};
