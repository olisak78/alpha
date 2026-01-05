import { XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface HealthErrorDisplayProps {
    healthError: string;
}

export function HealthErrorDisplay({ healthError }: HealthErrorDisplayProps) {
    return (
        <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Failed to fetch health data: {healthError}</span>
                </div>
            </CardContent>
        </Card>
    );
}
