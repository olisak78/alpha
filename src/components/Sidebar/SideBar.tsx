import {ChevronRight, ChevronLeft, User, Users, Wrench, Home, Link, Network, Brain, MessageSquare} from 'lucide-react';
import { useSidebarState } from '@/contexts/SidebarContext';
import { CloudAutomationIcon } from '../icons/CloudAutomationIcon';
import { UnifiedServicesIcon } from '../icons/UnifiedServiceIcon';
import { buildJiraFeedbackUrl } from '@/lib/utils';

interface SideBarProps {
    activeProject: string;
    projects: string[];
    onProjectChange: (project: string) => void;
}

// Map projects to their corresponding icons
const getProjectIcon = (project: string) => {
    switch (project) {
        case 'Me':
            return <User size={16} />;
        case 'Teams':
            return <Users size={16} />;
        case 'CIS@2.0':
            return <Network size={16} />;
        case 'Cloud Automation':
            return <CloudAutomationIcon className="h-4 w-4" />;
        case 'Unified Services':
           return <UnifiedServicesIcon className="h-4 w-4" />;
        case 'Self Service':
            return <Wrench size={16} />;
        case 'Links':
            return <Link size={16} />;
        case 'AI Arena':
            return <Brain size={16} />;
        default:
            return <Home size={16} />;
    }
};

export const SideBar = ({ activeProject, projects, onProjectChange }: SideBarProps) => {
    const { isExpanded, setIsExpanded } = useSidebarState();

    // Feedback configuration - easy to update
    const feedbackUrl = buildJiraFeedbackUrl({
        summary: '[BUG|FeatReq] Tell Us How Can We Help!',
        description: '', // Optional: Add a description if needed
    });

    return (
        <>
            <aside
                className={`
                    fixed top-0 left-0 h-screen bg-background border-r border-border
                    transition-all duration-300 ease-in-out z-50
                    ${isExpanded ? 'w-52' : 'w-16'}
                `}
            >
                
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`
                       absolute top-4 -right-3 z-50
                        flex items-center justify-center
                        w-6 h-6 rounded-full
                        bg-accent/80 dark:bg-accent border-2 border-border
                        shadow-md hover:shadow-lg
                        transition-all duration-200
                        hover:bg-accent hover:brightness-90 dark:hover:brightness-125
                        text-foreground dark:text-foreground
                    `}
                    aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {isExpanded ? (
                        <ChevronLeft className="h-4 w-4 text-foreground dark:text-white" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-foreground dark:text-white" />
                    )}
                </button>

                {/* Navigation */}
                <nav className="flex flex-col justify-between h-full py-3">
                    <div className="flex flex-col gap-1 px-2">
                        {projects.map((project) => (
                            <button
                                key={project}
                                onClick={() => onProjectChange(project)}
                                className={`
                                        group relative flex items-center transition-all duration-200
                                        w-full rounded-md px-2 py-1.5
                                        ${activeProject === project
                                        ? 'text-accent-foreground'
                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                                    }
                                `}
                                title={!isExpanded ? project : undefined}
                            >
                                {/* Icon Container - stays fixed */}
                                <div
                                    className={`
                                            flex items-center justify-center flex-shrink-0
                                            h-7 w-7
                                            rounded-full
                                            transition-colors duration-200
                                            ${activeProject === project
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                                        {getProjectIcon(project)}
                                    </div>
                                </div>

                                {/* Label - now smoothly shown/hidden */}
                                <span
                                    className={`
                                        ml-3 text-sm font-medium truncate
                                        transition-all duration-300
                                        ${isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}
                                    `}
                                >
                                    {project}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Send Feedback Button */}
                    <div className="px-2 pb-2">
                        <button
                            onClick={() => window.open(feedbackUrl, '_blank')}
                            className="group relative flex items-center transition-all duration-200 w-full rounded-md px-2 py-1 text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                            title={!isExpanded ? 'Send Feedback' : undefined}
                        >
                            {/* Icon Container */}
                            <div className="flex items-center justify-center flex-shrink-0 h-6 w-6 rounded-full transition-colors duration-200 bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground">
                                <div className="flex items-center justify-center [&>svg]:h-3.5 [&>svg]:w-3.5">
                                    <MessageSquare size={14} />
                                </div>
                            </div>

                            {/* Label - smoothly shown/hidden */}
                            <span
                                className={`
                                    ml-2.5 text-xs font-medium truncate
                                    transition-all duration-300
                                    ${isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}
                                `}
                            >
                                Send Feedback
                            </span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Spacer to push content when sidebar is expanded */}
            <div
                className={`
                    transition-all duration-300 ease-in-out
                    ${isExpanded ? 'w-52' : 'w-16'}
                `}
            />
        </>
    );
};
