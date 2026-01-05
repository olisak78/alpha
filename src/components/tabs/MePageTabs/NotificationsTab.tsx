import { forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, Inbox } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  dueDate?: string;
  createdAt: string;
  readBy?: string[];
}

interface NotificationsTabProps {
  notifications: Notification[];
  currentId: string;
  markAllRead: (userId: string) => void;
  isHighlightNotifications?: boolean;
}

const NotificationsTab = forwardRef<HTMLDivElement, NotificationsTabProps>(
  ({ notifications, currentId, markAllRead, isHighlightNotifications }, ref) => {
    return (
      <Card 
        ref={ref} 
        id="notifications" 
        className={isHighlightNotifications ? 'ring-2 ring-primary' : undefined}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary"/> Notification Center
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => markAllRead(currentId)}>
            Mark all as read
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length ? (
            <div className="rounded-md border overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((n) => {
                      const read = (n.readBy || []).includes(currentId);
                      const due = n.dueDate ? new Date(n.dueDate).toLocaleDateString() : "N/A";
                      return (
                        <TableRow key={n.id} className={!read ? "bg-muted/30" : undefined}>
                          <TableCell className="font-medium">{n.title}</TableCell>
                          <TableCell className="max-w-[440px]">{n.message}</TableCell>
                          <TableCell>{due}</TableCell>
                          <TableCell>{new Date(n.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            {!read ? (
                              <Badge variant="secondary">new</Badge>
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Inbox className="h-4 w-4"/>No notifications
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

NotificationsTab.displayName = "NotificationsTab";

export default NotificationsTab;
