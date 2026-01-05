export type Role = "user" | "assistant" | "system" | "summary";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number; // epoch
  alternatives?: string[]; // Alternative answers for regeneration
  currentAlternativeIndex?: number; // Current answer being shown
  isRegenerating?: boolean; // Loading state during regeneration
  isStreaming?: boolean; // Currently receiving streaming chunks
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatSettings {
  model: string;
  temperature: number; // 0..1
  maxTokens: number;   // 100..4000
  systemPrompt: string;
  deploymentId?: string; // Selected deployment ID for chat inference
}
