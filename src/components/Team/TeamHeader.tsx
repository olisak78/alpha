interface TeamHeaderProps {
  teamName: string;
}

export function TeamHeader({ teamName }: TeamHeaderProps) {
  return (
    <header className="pl-2 pt-2 pb-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold">
        {teamName?.startsWith("Team ") ? teamName : `Team ${teamName}`}
      </h1>
    </header>
  );
}
