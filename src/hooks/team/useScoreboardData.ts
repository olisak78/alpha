import type { Member as DutyMember} from "@/hooks/useOnDutyData";
import { JiraIssue } from "@/types/api";
import { useMemo } from "react";

interface useScoreboardDataProps {
    jiraIssues: JiraIssue[],
    githubStats: any[],
    onDutyData: any,
    memberById: Record<string, DutyMember>,
    members: DutyMember[],
    allTeams: any[]
}

export function useScoreboardData({
    jiraIssues,
    githubStats,
    onDutyData,
    memberById,
    members,
    allTeams
}: useScoreboardDataProps) {
    const jiraTop3 = useMemo(() => {
        const resolvedStatuses = new Set(["In Review", "Resolved", "Closed", "Done"]);
        const counts: Record<string, number> = {};
        (jiraIssues as any[]).forEach((iss: any) => {
            if (resolvedStatuses.has(iss.status) && memberById[iss.assigneeId]) {
                counts[iss.assigneeId] = (counts[iss.assigneeId] || 0) + 1;
            }
        });
        let results = Object.entries(counts).map(([id, count]) => ({ id, count, member: memberById[id] }));
        results.sort((a, b) => b.count - a.count);
        results = results.slice(0, 3);
        if (results.length < 3) {
            const fallbackVals = [12, 9, 7];
            const needed = Math.min(3, members.length);
            const picks = members.slice(0, needed).map((m, idx) => ({ id: m.id, count: fallbackVals[idx] || 5, member: m }));
            // merge existing with picks for unique ids
            const have = new Set(results.map(r => r.id));
            for (const p of picks) if (!have.has(p.id)) results.push(p);
            results = results.slice(0, 3);
        }
        return results;
    }, [jiraIssues, memberById, members]);
    
    const gitTop3 = useMemo(() => {
        // githubStats: { memberId, lines }[]
        let list = (githubStats as any[])
        .filter((r) => memberById[r.memberId])
        .map((r) => ({ id: r.memberId as string, lines: Number(r.lines) || 0, member: memberById[r.memberId] }));
        list.sort((a, b) => b.lines - a.lines);
        list = list.slice(0, 3);
        if (list.length < 3) {
            const fallbackVals = [18000, 14000, 11000];
            const needed = Math.min(3, members.length);
            const picks = members.slice(0, needed).map((m, idx) => ({ id: m.id, lines: fallbackVals[idx] || 9000, member: m }));
            const have = new Set(list.map(r => r.id));
            for (const p of picks) if (!have.has(p.id)) list.push(p);
            list = list.slice(0, 3);
        }
        return list;
    }, [githubStats, memberById, members]);
    
    const dutyTop3 = useMemo(() => {
        const counts: Record<string, number> = {};
        // On Duty: one day per row
        onDutyData.onDuty.forEach((r) => {
            if (memberById[r.assigneeId]) counts[r.assigneeId] = (counts[r.assigneeId] || 0) + 1;
        });
        // On Call: count days in range
        const dayMs = 24 * 60 * 60 * 1000;
        onDutyData.onCall.forEach((r) => {
            if (!memberById[r.assigneeId]) return;
            const start = new Date(r.start + "T00:00:00Z").getTime();
            const end = new Date(r.end + "T00:00:00Z").getTime();
            const days = Math.max(1, Math.round((end - start) / dayMs) + 1);
            counts[r.assigneeId] = (counts[r.assigneeId] || 0) + days;
        });
        let results = Object.entries(counts).map(([id, days]) => ({ id, days, member: memberById[id] }));
        results.sort((a, b) => b.days - a.days);
        results = results.slice(0, 3);
        if (results.length < 3) {
            const fallbackVals = [22, 18, 15];
            const needed = Math.min(3, members.length);
            const picks = members.slice(0, needed).map((m, idx) => ({ id: m.id, days: fallbackVals[idx] || 10, member: m }));
            const have = new Set(results.map(r => r.id));
            for (const p of picks) if (!have.has(p.id)) results.push(p);
            results = results.slice(0, 3);
        }
        return results;
    }, [onDutyData.onDuty, onDutyData.onCall, memberById, members]);
    
    // Cross-Team Scoreboard (deterministic mock across all pages)
    const SCORE_WEIGHTS = { dora: 30, runs: 15, quality: 25, availability: 20, alerts: 10 } as const;
    const crossTeamRows = useMemo(() => {
        const teams: string[] = Array.from(new Set(((allTeams as any[]) || []).map((t: any) => String(t.team || "").trim()).filter(Boolean))).sort();
        
        // team sizes
        const teamSizes: Record<string, number> = {};
        (allTeams as any[]).forEach((t: any) => {
            const k = String(t.team || "").trim();
            if (!k) return;
            teamSizes[k] = (teamSizes[k] || 0) + 1;
        });
        const avgSize = teams.length ? Math.round(teams.reduce((acc, t) => acc + (teamSizes[t] || 1), 0) / teams.length) : 1;
        
        const strSeed = (s: string) => {
            let h = 2166136261;
            for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
            return h >>> 0;
        };
        const prng = (seed: number) => {
            let s = seed >>> 0;
            return () => {
                s = (s * 1664525 + 1013904223) >>> 0;
                return s / 4294967295;
            };
        };
        const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
        
        const rows = teams.map((team) => {
            const rnd = prng(strSeed(team));
            const depFreq = Math.round(5 + rnd() * 25); // 5..30 / week
            const leadTime = Math.round(1 + rnd() * 71); // 1..72 hours
            const cfr = Math.round(5 + rnd() * 25); // 5..30 %
            const mttr = Math.round(1 + rnd() * 47); // 1..48 hours
            const cicdRuns = Math.round(20 + rnd() * 180); // 20..200 per week
            const coverage = Math.round(60 + rnd() * 35); // 60..95 %
            const vulns = Math.round(rnd() * 10); // 0..10
            const codeQuality = Math.round(70 + rnd() * 29); // 70..99
            const availability = 98 + rnd() * 1.99; // 98..99.99
            const alerts = Math.round(5 + rnd() * 115); // 5..120
            
            // Normalize 0..1
            const nDep = clamp01((depFreq - 5) / 25);
            const nLead = clamp01(1 - (leadTime - 1) / 71);
            const nCfr = clamp01(1 - (cfr - 5) / 25);
            const nMttr = clamp01(1 - (mttr - 1) / 47);
            const dora = (nDep + nLead + nCfr + nMttr) / 4;
            
            const nRuns = clamp01((cicdRuns - 20) / 180);
            const nCov = clamp01((coverage - 60) / 35);
            const nCodeQ = clamp01((codeQuality - 70) / 29);
            const nVulns = clamp01(1 - vulns / 10);
            const quality = (nCov + nCodeQ + nVulns) / 3;
            
            const nAvail = clamp01((availability - 98) / 1.99);
            const nAlerts = clamp01((alerts - 5) / 115);
            
            // Weighted overall (0..100)
            const overallRaw = (
                dora * SCORE_WEIGHTS.dora +
                nRuns * SCORE_WEIGHTS.runs +
                quality * SCORE_WEIGHTS.quality +
                nAvail * SCORE_WEIGHTS.availability +
                nAlerts * SCORE_WEIGHTS.alerts
            );
            
            // Normalize by team size relative to average
            const size = teamSizes[team] || 1;
            const normalized = Math.max(0, Math.min(100, overallRaw * (avgSize / Math.max(1, size))));
            
            return {
                team,
                overall: Math.round(normalized),
                dora: Math.round(dora * 100),
                runs: cicdRuns,
                quality: Math.round(quality * 100),
                availability: availability.toFixed(2),
                alerts,
                size,
            };
        });
        
        rows.sort((a, b) => b.overall - a.overall);
        return rows;
    }, []);
    return { jiraTop3, gitTop3, dutyTop3, crossTeamRows, SCORE_WEIGHTS };
    
}