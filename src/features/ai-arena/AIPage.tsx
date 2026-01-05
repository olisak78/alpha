import AILeftPane from "./AILeftPane";
import AIChatPane from "./AIChatPane";
import { createContext, useContext } from "react";
import { useChat } from "./hooks/useChat";

// Provide the useChat instance to both panes without prop drilling
const ChatCtx = createContext<ReturnType<typeof useChat> | null>(null);
export const useChatCtx = () => {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChatCtx must be used within <AIPage>");
  return ctx;
};

export default function AIPage() {
  const chat = useChat();
  return (
    <ChatCtx.Provider value={chat}>
      <div className="h-full w-full flex overflow-hidden bg-white dark:bg-[#212121]">
        <AILeftPane />
        <AIChatPane />
      </div>
    </ChatCtx.Provider>
  );
}