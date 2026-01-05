import { AlertCircle, Check } from "lucide-react";

interface DialogIndicatorProps {
  status: boolean, // true == success
  message: string
  show?: boolean,


}

const DialogIndicator = ({ status, message, show }: DialogIndicatorProps) => {
  if (!message || !show) return null;

  const indicatorClass = 'flex items-center gap-1 text-sm mt-1';
  const iconClass = 'h-3 w-3';

  return (status ?
    <div className={`${indicatorClass} text-green-600 dark:text-green-400`}>
      <Check className={iconClass} />
      <span>{message}</span>
    </div> : <div className={`${indicatorClass} text-destructive`}>
      <AlertCircle className={iconClass} />
      <span>{message}</span>
    </div>
  );

};

export default DialogIndicator;