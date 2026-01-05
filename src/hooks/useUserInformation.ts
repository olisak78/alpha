import { useAuthWithRole } from '@/hooks/useAuthWithRole';
import { useTeamById } from '@/hooks/api/useTeams';

interface UserInformationData {
  fullname: string;
  team: string;
  email: string;
  role: string;
}

interface UseUserInformationProps {
  userInfo: UserInformationData;
}

interface ProcessedUserInformation {
  fullName: string;
  email: string;
  team: string;
  role: string;
}

export function useUserInformation({ userInfo }: UseUserInformationProps): ProcessedUserInformation {
  const { memberData } = useAuthWithRole();
  
  // Fetch team data using team_id from memberData
  const { data: teamData } = useTeamById(memberData?.team_id || '', {
    enabled: !!memberData?.team_id
  });
  
  // Construct full name from first_name + last_name
  const fullName = memberData?.first_name || memberData?.last_name
    ? `${memberData.first_name || ''} ${memberData.last_name || ''}`.trim()
    : userInfo.fullname || 'Not available';

  const email = memberData?.email || userInfo.email || 'Not available';
  
  // Get team name and role with simple fallback logic
  const team = teamData?.name || teamData?.title || userInfo.team || 'Not available';
  const role = teamData?.owner === memberData?.email ? 'Owner' 
    : memberData?.team_role || userInfo.role || 'Member';

  return {
    fullName,
    email,
    team,
    role
  };
}
