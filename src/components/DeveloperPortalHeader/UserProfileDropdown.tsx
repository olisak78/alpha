import { LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/hooks/api/useMembers";
import { SwaggerIcon } from "@/components/icons/SwaggerIcon";
import { getNewBackendUrl } from "@/constants/developer-portal";
import SettingsDialog from "@/components/dialogs/SettingsDialog";

interface UserProfileDropdownProps {
  user: {
    name: string;
    email?: string;
    picture?: string;
    memberId?: string;
  };
  onLogout: () => void;
  isLoading?: boolean;
}

export function UserProfileDropdown({ user, onLogout, isLoading }: UserProfileDropdownProps) {
  const { user: authUser } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fetch current user data to get first_name and last_name
  const { data: memberData } = useCurrentUser({
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  const userInitials = useMemo(() => {
    if (memberData?.first_name && memberData?.last_name) {
      return `${memberData.first_name[0]}${memberData.last_name[0]}`.toUpperCase();
    }

    // Fallback to splitting the name
    return user.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [memberData?.first_name, memberData?.last_name, user.name]);

  const handleSwaggerClick = () => {
    const backendUrl = getNewBackendUrl();
    window.open(`${backendUrl}/swagger/index.html#/`, '_blank');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.picture} alt={user.name} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              {user.email && (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              )}
              <p className="text-xs leading-none text-muted-foreground">
                Signed in via GitHub Tools
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSwaggerClick}>
            <SwaggerIcon className="mr-2 h-4 w-4" />
            <span>Swagger</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLogout} disabled={isLoading}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isLoading ? 'Logging out...' : 'Log out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </>
  );
}
