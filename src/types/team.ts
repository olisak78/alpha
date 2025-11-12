import type { Member } from '@/hooks/useOnDutyData';

// Define proper types for scoreboard data
export interface ScoreboardMember {
  id: string;
  member: Member;
}

export interface JiraTop3Item extends ScoreboardMember {
  count: number;
}

export interface GitTop3Item extends ScoreboardMember {
  lines: number;
}

export interface DutyTop3Item extends ScoreboardMember {
  days: number;
}

export interface CrossTeamRow {
  team: string;
  overall: number;
  dora: number;
  runs: number;
  quality: number;
  availability: string;
  alerts: number;
  size: number;
}

export interface ScoreWeights {
  readonly dora: number;
  readonly runs: number;
  readonly quality: number;
  readonly availability: number;
  readonly alerts: number;
}
