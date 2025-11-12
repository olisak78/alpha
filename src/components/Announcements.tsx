import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";
import teamsData from "@/data/team/teams.json";

interface AnnouncementsProps {
    title: string;
    className?: string;
}

export const Announcements: React.FC<AnnouncementsProps> = ({ className, title }) => {

    const formatName = (name: string) =>
        name.includes(",")
            ? name.split(",").reverse().map((s) => s.trim()).join(" ")
            : name;

    // Get team members list and filter birthdays
    const teamsList = teamsData as { team: string; name: string; email: string; external?: string }[];

    // Mock birthdays for today - picks first 2 non-external team members
    const birthdaysTodayNames = useMemo(() => {
        const picks = teamsList.filter((p) => !p.external).slice(0, 2);
        return picks.map((p) => formatName(p.name));
    }, []);

    // Don't render anything if no birthdays today
    if (birthdaysTodayNames.length === 0) {
        return null;
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-lg">
                    Welcome to developer portal{' '}
                    <span className="alpha-text">
                        alpha
                    </span>
                    {' '}version!
                </div>
            </CardContent>
        </Card>
    );
};
