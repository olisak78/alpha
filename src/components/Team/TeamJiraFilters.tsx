import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTeamContext } from "@/contexts/TeamContext";

// MIGRATED: Import Jira filter state directly from Zustand
import {
  useJiraSearch,
  useJiraAssigneeFilter,
  useJiraStatusFilter,
  useJiraSortBy,
  useJiraFilterActions,
} from '@/stores/teamStore';

function LabelText({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground mb-1">{children}</div>;
}

export function TeamJiraFilters() {
  //  Get members from context (data, not UI state)
  const { members } = useTeamContext();
  
  //   Get filter state from Zustand (granular subscriptions)
  const search = useJiraSearch();
  const assigneeFilter = useJiraAssigneeFilter();
  const statusFilter = useJiraStatusFilter();
  const sortBy = useJiraSortBy();
  
  //  Get actions from Zustand (stable functions)
  const {
    setSearch,
    setAssigneeFilter,
    setStatusFilter,
    setSortBy,
  } = useJiraFilterActions();

  const taskStatuses = ['In Progress', 'Open', 'Resolved', 'Closed'];

  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-end mb-4">
      <div className="flex-1">
        <LabelText>Search</LabelText>
        <Input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search key or summary" 
        />
      </div>
      <div className="min-w-[180px]">
        <LabelText>Assignee</LabelText>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Unassigned">Unassigned</SelectItem>
            {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>      
      <div className="min-w-[160px]">
        <LabelText>Status</LabelText>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {taskStatuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-[200px]">
        <LabelText>Order by</LabelText>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_desc">Updated (newest)</SelectItem>
            <SelectItem value="updated_asc">Updated (oldest)</SelectItem>
            <SelectItem value="created_desc">Created (newest)</SelectItem>
            <SelectItem value="created_asc">Created (oldest)</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}