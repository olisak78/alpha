import { Button } from "@/components/ui/button";
import { useActualTheme, useThemeStore } from "@/stores/themeStore";
import { Sun, Moon } from 'lucide-react';
import { Separator } from '../ui/separator';

export default function ThemeSection() {
  const actualTheme = useActualTheme();
  const setTheme = useThemeStore(state => state.setTheme);

  return (
    <div className="bg-muted/20 rounded-lg p-4 border">
      <div className="mb-3">
        <h5 className="text-sm font-medium mb-2">Theme</h5>
        <p className="text-sm text-muted-foreground mb-3">
          Choose your preferred theme for the developer portal.
        </p>
      </div>
      <Separator className="mb-4 flex-shrink-0" />
      <div className="flex gap-2">
        <Button
          variant={actualTheme === 'light' ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setTheme('light')}
        >
          <Sun className="h-4 w-4" />
          Light
        </Button>
        <Button
          variant={actualTheme === 'dark' ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setTheme('dark')}
        >
          <Moon className="h-4 w-4" />
          Dark
        </Button>
      </div>
    </div>
  );
}
