import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface JiraIssuesFilterProps {
  search?: string;
  onSearchChange?: (search: string) => void;
  status: string;
  project: string;
  availableStatuses: string[];
  availableProjects: string[];
  onStatusChange: (status: string) => void;
  onProjectChange: (project: string) => void;
  sortBy?: string;
  onSortByChange?: (sortBy: string) => void;
  subtaskFilter?: string;
  onSubtaskFilterChange?: (filter: string) => void;
}

function LabelText({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground mb-1">{children}</div>;
}

export default function JiraIssuesFilter({
  search,
  onSearchChange,
  status,
  project,
  availableStatuses,
  availableProjects,
  onStatusChange,
  onProjectChange,
  sortBy,
  onSortByChange,
  subtaskFilter,
  onSubtaskFilterChange,
}: JiraIssuesFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-end">
      {/* Search */}
      {onSearchChange && (
        <div className="flex-1">
          <LabelText>Search</LabelText>
          <Input
            value={search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search key or summary"
          />
        </div>
      )}

      {/* Status Filter */}
      <div className="min-w-[160px]">
        <LabelText>Status</LabelText>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {availableStatuses.map((s) => (
              <SelectItem key={`status-${s}`} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project Filter */}
      <div className="min-w-[160px]">
        <LabelText>Project</LabelText>
        <Select value={project} onValueChange={onProjectChange}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {availableProjects.map((p) => (
              <SelectItem key={`project-${p}`} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subtask Filter - NEW */}
      {onSubtaskFilterChange && (
        <div className="min-w-[180px]">
          <LabelText>Show</LabelText>
          <Select value={subtaskFilter || "parents"} onValueChange={onSubtaskFilterChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parents">Parent Tasks Only</SelectItem>
              <SelectItem value="all">All (Parents + Subtasks)</SelectItem>
              <SelectItem value="subtasks">Subtasks Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Order by */}
      {onSortByChange && (
        <div className="min-w-[200px]">
          <LabelText>Order by</LabelText>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_desc">Updated (newest)</SelectItem>
              <SelectItem value="updated_asc">Updated (oldest)</SelectItem>
              <SelectItem value="priority_desc">Priority (high to low)</SelectItem>
              <SelectItem value="priority_asc">Priority (low to high)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
