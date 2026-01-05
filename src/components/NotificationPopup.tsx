import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, Inbox, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  dueDate?: string;
  createdAt: string;
  readBy?: string[];
}

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  currentId: string;
  markAllRead: (userId: string) => void;
  unreadCount: number;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  isOpen,
  onClose,
  notifications,
  currentId,
  markAllRead,
  unreadCount
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleMarkAllRead = () => {
    markAllRead(currentId);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        ref={popupRef}
        className={cn(
          "fixed top-16 right-4 z-[100] w-96 max-w-[calc(100vw-2rem)]",
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
          "rounded-lg shadow-2xl",
          "transform transition-all duration-200 ease-out",
          "animate-in slide-in-from-top-2 fade-in-0"
        )}
        style={{
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleMarkAllRead}
                className="text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((notification) => {
                const isRead = (notification.readBy || []).includes(currentId);
                const dueDate = notification.dueDate 
                  ? new Date(notification.dueDate).toLocaleDateString() 
                  : null;
                const createdAt = new Date(notification.createdAt);
                const isRecent = Date.now() - createdAt.getTime() < 24 * 60 * 60 * 1000; // 24 hours

                return (
                  <div 
                    key={notification.id} 
                    className={cn(
                      "p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                      !isRead && "bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-l-blue-500"
                    )}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={cn(
                            "font-medium text-sm truncate",
                            !isRead && "text-blue-900 dark:text-blue-100"
                          )}>
                            {notification.title}
                          </h3>
                          {!isRead && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <span>
                            {isRecent ? (
                              `${Math.round((Date.now() - createdAt.getTime()) / (60 * 60 * 1000))}h ago`
                            ) : (
                              createdAt.toLocaleDateString()
                            )}
                          </span>
                          {dueDate && (
                            <span className="text-orange-600 dark:text-orange-400">
                              Due: {dueDate}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {isRead ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                All caught up!
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No new notifications right now.
              </p>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </>
  );
};