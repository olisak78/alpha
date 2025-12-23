import { Bell, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfileDropdown } from "@/components/DeveloperPortalHeader/UserProfileDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useTheme } from "@/contexts/ThemeContext";

interface DeveloperPortalHeaderProps {
  unreadCount: number;
  onNotificationClick: () => void;
}

export function DeveloperPortalHeader({
  unreadCount,
  onNotificationClick
}: DeveloperPortalHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { actualTheme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="bg-background">
      {/* Main header row */}
      <div className="px-4 py-3 pl-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">

         
          <h1
            className="text-lg font-semibold text-foreground cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={() => navigate('/')}
          >
            Developer Portal
          </h1>
        </div>

        {/* Breadcrumbs on the right side of the title */}
        <div className="flex-1 flex items-center justify-start ml-6">
          <Breadcrumbs />
        </div>

        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-foreground hover:bg-accent border border-border hover:border-border p-2 h-8 w-8 transition-colors"
            aria-label={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
            onClick={toggleTheme}
          >
            {actualTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-foreground hover:bg-accent border border-border hover:border-border p-2 h-8 w-8 transition-colors"
            aria-label="Notifications"
            onClick={onNotificationClick}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 grid place-items-center rounded-full bg-red-500 text-white h-4 min-w-[1rem] px-1 text-[10px] leading-none font-medium">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* User Menu */}
          {user && (
            <UserProfileDropdown
              user={user}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </div>
  );
}