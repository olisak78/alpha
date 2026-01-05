import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CodeQualityCardProps {
    sonarData: any;
}

export function CodeQualityCard({ sonarData }: CodeQualityCardProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Code Quality
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {/* Coverage */}
                <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
                    <span className="text-sm">Coverage</span>
                    <span className="text-sm font-semibold text-green-600">
                        {sonarData.coverage !== null ? `${sonarData.coverage.toFixed(1)}%` : 'N/A'}
                    </span>
                </div>

                {/* Vulnerabilities */}
                <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
                    <span className="text-sm">Vulnerabilities</span>
                    <span className={`text-sm font-semibold ${sonarData.vulnerabilities === 0 ? 'text-green-600' : sonarData.vulnerabilities && sonarData.vulnerabilities > 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {sonarData.vulnerabilities !== null ? sonarData.vulnerabilities : 'N/A'}
                    </span>
                </div>

                {/* Code Smells */}
                <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
                    <span className="text-sm">Code Smells</span>
                    <span className={`text-sm font-semibold ${sonarData.codeSmells === 0 ? 'text-green-600' : sonarData.codeSmells && sonarData.codeSmells > 20 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {sonarData.codeSmells !== null ? sonarData.codeSmells : 'N/A'}
                    </span>
                </div>

                {/* Quality Gate */}
                <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
                    <span className="text-sm">Quality Gate</span>
                    <span className={`text-sm font-semibold ${sonarData.qualityGate === 'Passed' ? 'text-green-600' : 'text-red-600'}`}>
                        {sonarData.qualityGate || 'N/A'}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
