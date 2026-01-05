interface StatusDotProps {
    status?: string | boolean;
}

export function StatusDot({ status }: StatusDotProps) {
    const getStatusDisplay = (status?: string | boolean) => {
        if (status === undefined || status === null) return { dotColor: "bg-gray-400", shouldAnimate: false };

        // Handle boolean values
        if (typeof status === 'boolean') {
            return status 
                ? { dotColor: "bg-green-500", shouldAnimate: true }
                : { dotColor: "bg-red-500", shouldAnimate: true };
        }

        // Handle string values
        switch (status.toUpperCase()) {
            case 'UP':
                return { dotColor: "bg-green-500", shouldAnimate: true };
            case 'DOWN':
                return { dotColor: "bg-red-500", shouldAnimate: true };
            default:
                return { dotColor: "bg-yellow-500", shouldAnimate: false };
        }
    };

    const { dotColor, shouldAnimate } = getStatusDisplay(status);
    return (
        <span className="relative flex h-2 w-2">
            {shouldAnimate && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
        </span>
    );
}
