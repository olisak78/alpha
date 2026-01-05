import { TeamColorPicker } from "./TeamColorPicker";
import { useUpdateTeam } from "@/hooks/api/mutations/useTeamMutations";
import { useToast } from "@/hooks/use-toast";
import type { Team } from "@/types/api";

interface TeamHeaderProps {
  teamName: string;
  currentTeam?: Team;
  isAdmin?: boolean;
}

export function TeamHeader({ teamName, currentTeam, isAdmin = false }: TeamHeaderProps) {
  const { toast } = useToast();
  const updateTeamMutation = useUpdateTeam({
    onSuccess: () => {
      toast({
        title: "Team color updated",
        description: "The team color has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update team color",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleColorChange = (color: string) => {
    if (!currentTeam) return;

    // Parse metadata if it's a string
    let metadata = currentTeam.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }

    // Update the color in metadata
    const updatedMetadata = {
      ...metadata,
      color,
    };

    updateTeamMutation.mutate({
      id: currentTeam.id,
      data: {
        display_name: currentTeam.title,
        description: currentTeam.description,
        metadata: updatedMetadata,
      },
    });
  };

  // Get current color from team metadata
  let currentColor = "#6b7280"; // default gray
  if (currentTeam?.metadata) {
    let metadata = currentTeam.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        // ignore
      }
    }
    if (metadata?.color) {
      currentColor = metadata.color;
    }
  }

  return (
    <header className="pl-2 pt-2 pb-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold">
        {teamName?.startsWith("Team ") ? teamName : `Team ${teamName}`}
      </h1>
      {isAdmin && currentTeam && (
        <TeamColorPicker
          currentColor={currentColor}
          onColorChange={handleColorChange}
          disabled={updateTeamMutation.isPending}
        />
      )}
    </header>
  );
}
