import { LayoutDirection } from "@/types/developer-portal";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Info } from "lucide-react";

interface SmallCardProps {
    title: string;
    value: number | string;
    isError?: boolean;
    isLoading?: boolean;
    tooltip?: string;
    description?: string;
}

interface SmallCardsBlockProps {
    cards: SmallCardProps[];
    layout?: LayoutDirection;
}

export default function SmallCardsBlock({ cards, layout = 'horizontal' }: SmallCardsBlockProps) {
    // Determine grid classes based on layout direction
    const gridClasses = layout === 'vertical' 
        ? "grid grid-cols-1 gap-4" 
        : "grid grid-cols-1 md:grid-cols-2 gap-4";
    
    return (
        <TooltipProvider>
            <div className={gridClasses}>
                {cards.map((card,index) => 
                    <SmallCard 
                        key={`${card.title}-${index}`} 
                        title={card.title} 
                        value={card.value} 
                        isError={card.isError} 
                        isLoading={card.isLoading}
                        tooltip={card.tooltip}
                        description={card.description}
                    />
                )}
            </div>
        </TooltipProvider>
    );
}
    
function SmallCard({ title, value, isError, isLoading, tooltip, description }: SmallCardProps) {
    const getValueClass = () => {
        if (isError) return "text-sm text-destructive";
        if (isLoading) return "text-sm";
        return "text-3xl font-bold";
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-1.5">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    {tooltip && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>{tooltip}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className={getValueClass()}>{value}</div>
                {description && (
                    <div className="text-xs text-muted-foreground">
                        {description}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}