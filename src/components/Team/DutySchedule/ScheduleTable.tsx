import { Fragment, ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Scissors, Trash2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Member } from "@/hooks/useScheduleData";
import { calculateDays, getDateRangeType } from "@/utils/schedule-utils";

interface BaseShift {
  id: string;
  start: string;
  end: string;
  assigneeId: string;
}

interface ScheduleTableProps<T extends BaseShift> {
  shifts: T[];
  members: Member[];
  headers: string[];
  onUpdateShift: (id: string, updates: Partial<T>) => void;
  onAddShift: () => void;
  onAddShiftAfter: (afterId: string) => void;
  onSplitShift: (id: string) => void;
  onDeleteShift: (id: string) => void;
  renderExtraColumns?: (shift: T) => ReactNode[];
  emptyMessage?: string;
}

export function ScheduleTable<T extends BaseShift>({
  shifts,
  members,
  headers,
  onUpdateShift,
  onAddShift,
  onAddShiftAfter,
  onSplitShift,
  onDeleteShift,
  renderExtraColumns,
  emptyMessage = "No assignments yet."
}: ScheduleTableProps<T>) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(header => (
                <TableHead key={header}>{header}</TableHead>
              ))}
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={headers.length + 1} className="py-1 text-center">
                  <p className="text-lg mt-2">{emptyMessage}</p>
                  <br />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label="Add first row"
                    onClick={onAddShift}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
            
            {shifts.map(shift => (
              <Fragment key={shift.id}>
                <TableRow>
                  <TableCell>
                    <Input 
                      type="date" 
                      value={shift.start} 
                      onChange={(e) => onUpdateShift(shift.id, { start: e.target.value } as Partial<T>)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="date" 
                      value={shift.end} 
                      onChange={(e) => onUpdateShift(shift.id, { end: e.target.value } as Partial<T>)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getDateRangeType(shift.start, shift.end)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={shift.assigneeId} 
                      onValueChange={(v) => onUpdateShift(shift.id, { assigneeId: v } as Partial<T>)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {calculateDays(shift.start, shift.end)}
                    </span>
                  </TableCell>
                  {renderExtraColumns?.(shift)}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSplitShift(shift.id)}>
                          <Scissors className="h-4 w-4 mr-2" />
                          Split
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteShift(shift.id)} 
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={headers.length + 1} className="py-1 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label="Add row after this one"
                      onClick={() => onAddShiftAfter(shift.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
