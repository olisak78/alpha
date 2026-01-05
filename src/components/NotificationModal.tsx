import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, Inbox} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  dueDate?: string;
  createdAt: string;
  readBy?: string[];
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  currentId: string;
  markAllRead: (userId: string) => void;
  unreadCount: number;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  currentId,
  markAllRead,
  unreadCount
}) => {

  const handleMarkAllRead = () => {
    markAllRead(currentId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Center
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </DialogTitle>
          
         
        </DialogHeader>

        <div className="space-y-4">
          {notifications.length > 0 ? (
            <>
              {unreadCount > 0 && (
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark all as read
                  </Button>
                </div>
              )}

              <div className="rounded-md border overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Title</TableHead>
                        <TableHead className="max-w-[300px]">Message</TableHead>
                        <TableHead className="w-[120px]">Due Date</TableHead>
                        <TableHead className="w-[140px]">Created</TableHead>
                        <TableHead className="w-[80px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((notification) => {
                        const isRead = (notification.readBy || []).includes(currentId);
                        
                        const dueDate = notification.dueDate 
                          ? new Date(notification.dueDate).toLocaleDateString() 
                          : "N/A";
                        
                        const createdDate = new Date(notification.createdAt).toLocaleDateString();

                        return (
                          <TableRow 
                            key={notification.id} 
                            className={!isRead ? "bg-muted/30" : undefined}
                          >
                            <TableCell className="font-medium">
                              {notification.title}
                            </TableCell>
                            <TableCell className="max-w-[300px] break-words">
                              {notification.message}
                            </TableCell>
                            <TableCell>
                              {dueDate}
                            </TableCell>
                            <TableCell>
                              {createdDate}
                            </TableCell>
                            <TableCell>
                              {!isRead ? (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
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
            </>
          ) : (

            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="rounded-full bg-muted p-3">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">No current messages</h3>
                <p className="text-sm text-muted-foreground">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};