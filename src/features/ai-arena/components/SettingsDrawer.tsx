import { X, ChevronDown } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { Button } from "@/components/ui/button";

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const { settings, updateSettings, resetSettings } = useChat();
  return (
    <div className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out ${open ? "" : "translate-x-full"}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Settings</h2>
        <Button variant="ghost" className="h-10 w-10" onClick={onClose}><X className="h-5 w-5" /></Button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="model">Model</label>
          <button id="model" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
            <span>{settings.model}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
          <p className="text-xs text-muted-foreground">Choose the AI model for responses</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="temperature">Temperature</label>
            <span className="text-sm text-muted-foreground">{settings.temperature}</span>
          </div>
          <input
            id="temperature" type="range" min={0} max={1} step={0.1}
            value={settings.temperature}
            onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Higher values make output more random (0-1)</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="maxTokens">Max Tokens</label>
          <input
            id="maxTokens" type="number" min={100} max={4000} step={100}
            value={settings.maxTokens}
            onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value, 10) })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">Maximum length of the response (100-4000)</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="systemPrompt">System Prompt</label>
          <textarea
            id="systemPrompt" rows={6}
            value={settings.systemPrompt}
            onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">Instructions that guide the AI's behavior and responses</p>
        </div>

        <Button variant="outline" className="w-full" onClick={resetSettings}>Reset to Defaults</Button>
      </div>
    </div>
  );
}