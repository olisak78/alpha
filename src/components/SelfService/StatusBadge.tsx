import { Badge } from "@/components/ui/badge";

/**
 * StatusBadge Component
 * 
 * Displays a styled badge for Jenkins job status
 */
interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'success':
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0">
          Success
        </Badge>
      );
    case 'failure':
    case 'failed':
      return (
        <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">
          Failed
        </Badge>
      );
    case 'running':
      return (
        <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-0">
          Running
        </Badge>
      );
    case 'queued':
    case 'pending':
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
          Queued
        </Badge>
      );
    case 'aborted':
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">
          Aborted
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-gray-400 text-gray-700">
          {status}
        </Badge>
      );
  }
};