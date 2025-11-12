import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface JiraIssuesFilterProps {
  status: string;
  project: string;
  availableStatuses: string[];
  availableProjects: string[];
  onStatusChange: (status: string) => void;
  onProjectChange: (project: string) => void;
}

export default function JiraIssuesFilter({
  status,
  project,
  availableStatuses,
  availableProjects,
  onStatusChange,
  onProjectChange,
}: JiraIssuesFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="text-sm">Status</div>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem key="all-status" value="all">All</SelectItem>
          {availableStatuses.map((s) => (
            <SelectItem key={`status-${s}`} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="ml-2 text-sm">Project</div>
      <Select value={project} onValueChange={onProjectChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem key="all-project" value="all">All</SelectItem>
          {availableProjects.map((p) => (
            <SelectItem key={`project-${p}`} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
