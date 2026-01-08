import { Card, CardContent } from "@/components/ui/card";
import { PluginApiData } from "@/hooks/api/usePlugins";
import { useSubscribeToPlugin, useUnsubscribeFromPlugin } from "@/hooks/api/usePluginSubscriptions";
import { Edit, Pin, Trash2 } from "lucide-react";
import { DynamicIcon, getCategoryColor } from "../models/models";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";

interface PluginCardProps {
    plugin: PluginApiData;
    onOpen: (plugin: PluginApiData) => void;
    onEdit: (plugin: PluginApiData) => void;
    onDelete: (plugin: PluginApiData) => void;
}

const PluginCard = ({ plugin, onOpen, onEdit, onDelete }: PluginCardProps) => {
    const subscribeToPlugin = useSubscribeToPlugin();
    const unsubscribeFromPlugin = useUnsubscribeFromPlugin();
    const { user } = useAuthWithRole();

    // Extract category and version from plugin data (with fallbacks)
    const category = plugin.category || 'Development';
    const version = plugin.version || 'v1.0.0';
    const isSubscribed = plugin.subscribed || false;

    // Check if current user can edit/delete this plugin
    // User can edit/delete if they are either:
    // 1. The owner of the plugin
    // 2. A portal admin
    const canModifyPlugin = user && (
        user.id === plugin.owner ||
        user.portal_admin === true
    );

    const getOwnerDisplayName = (): string => {
        // Try to get from metadata first
        console.log(plugin.metadata)
        if (plugin.metadata?.author_name) {
            return `${plugin.metadata.author_name}`;
        }

        // Fallback to the owner ID if metadata is not available
        return plugin.owner;
    };

    const handlePinClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isSubscribed) {
            unsubscribeFromPlugin.mutate(plugin.id);
        } else {
            subscribeToPlugin.mutate(plugin.id);
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(plugin);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(plugin);
    };

    return (
        <Card className="h-full flex flex-col hover:shadow-md transition-shadow relative">
            <CardContent className="p-5 flex flex-col h-full">
                {/* Pin icon in top right */}
                <button
                    onClick={handlePinClick}
                    disabled={subscribeToPlugin.isPending || unsubscribeFromPlugin.isPending}
                    className={`absolute top-4 right-4 transition-colors ${isSubscribed
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={isSubscribed ? "Unpin plugin" : "Pin plugin"}
                    title={isSubscribed ? "Unpin from sidebar" : "Pin to sidebar"}
                >
                    <Pin className={`h-4 w-4 ${isSubscribed ? 'fill-current' : ''}`} />
                </button>

                {/* Header with icon and title */}
                <div className="flex items-start gap-3 mb-3 pr-6">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                        <DynamicIcon name={plugin.icon} className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight truncate">
                            {plugin.title}
                        </h3>
                        {/* Category and version */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <Badge
                                variant="secondary"
                                className={`text-[10px] px-1.5 py-0 h-5 font-medium ${getCategoryColor(category)}`}
                            >
                                {category}
                            </Badge>
                            <span className="text-muted-foreground text-xs">•</span>
                            <span className="text-xs text-muted-foreground">{version}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">
                    {plugin.description || 'No description provided'}
                </p>

                {/* Footer with author and action buttons */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-xs text-muted-foreground">
                        By {getOwnerDisplayName()}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {/* Edit button - only show if user can modify */}
                        {canModifyPlugin && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={handleEditClick}
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Edit plugin</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {/* Delete button - only show if user can modify */}
                        {canModifyPlugin && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleDeleteClick}
                                            disabled={isSubscribed}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isSubscribed ? 'Unpin the plugin before deleting' : 'Delete plugin'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {/* Open button */}
                        <Button size="sm" className="h-8 px-4" onClick={() => onOpen(plugin)}>
                            Open
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
export default PluginCard;