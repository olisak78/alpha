import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
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
    }, [teamsList]);

    // Don't render anything if no birthdays today
    if (birthdaysTodayNames.length === 0) {
        return null;
    }

    return (
        <div className={className}>
            <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50/20 via-purple-50/20 to-pink-50/20 dark:from-slate-800/20 dark:via-purple-900/5 dark:to-blue-900/5 p-6">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/20 to-purple-400/20 rounded-full blur-2xl"></div>

                {/* Content */}
                <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                            Beta Version
                        </h3>
                    </div>

                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Welcome to the Developer Portal! Experience new features and help shape the future.
                    </div>
                </div>
            </div>
        </div>
    );
};
