import { useState, useRef, useEffect, useCallback } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./components/MessageBubble";
import { InputBar } from "./components/InputBar";
import { useChatCtx } from "./AIPage";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { DeploymentSelector } from "./components/DeploymentSelector";

export default function AIChatPane() {
  const { active, messages, send, regenerate, navigateAlternative, settings } = useChatCtx();
  const [openSettings, setOpenSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const lastScrollTopRef = useRef(0);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const hasDeployment = !!settings.deploymentId;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // noop
    }
  };

  // Handle user scroll - disable auto-scroll if user scrolls up
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const currentScrollTop = scrollTop;
    const maxScroll = scrollHeight - clientHeight;
    const distanceFromBottom = maxScroll - currentScrollTop;
    
    // If user scrolled up (any upward movement), disable auto-scroll immediately
    if (currentScrollTop < lastScrollTopRef.current) {
      setShouldAutoScroll(false);
    }
    // Only re-enable auto-scroll if user is very close to bottom (within 5px)
    else if (distanceFromBottom <= 5) {
      setShouldAutoScroll(true);
    }
    
    lastScrollTopRef.current = currentScrollTop;
  }, []);

  // Auto-scroll effect - scroll when messages change and auto-scroll is enabled OR when new message is added
  useEffect(() => {
    const isNewMessage = messages.length > lastMessageCount;
    
    if ((shouldAutoScroll || isNewMessage) && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      
      // If we scrolled due to a new message, re-enable auto-scroll
      if (isNewMessage) {
        setShouldAutoScroll(true);
      }
    }
    
    setLastMessageCount(messages.length);
  }, [messages, shouldAutoScroll]); // Removed lastMessageCount from dependencies

  // Reset scroll state when starting a new conversation
  useEffect(() => {
    if (messages.length === 0) {
      setShouldAutoScroll(true);
      setLastMessageCount(0);
    }
  }, [messages.length]);

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-white dark:bg-[#212121]">
      {/* Deployment Selector */}
      <DeploymentSelector />

      {/* Chat Messages Area */}
      <div className="relative overflow-hidden flex-1">
        <div 
          ref={scrollContainerRef}
          className="h-full w-full overflow-y-auto"
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            // Empty state - ChatGPT style
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="max-w-2xl text-center space-y-6">
                <h1 className="text-4xl font-semibold text-gray-800 dark:text-gray-100">
                  How can I help you today?
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                  <div
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => send("Help me debug a code issue")}
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Help me debug a code issue
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => send("Explain a technical concept")}
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Explain a technical concept
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => send("Write some code for me")}
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Write some code for me
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => send("Review my architecture")}
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Review my architecture
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl py-4">
              {messages.map(m => (
                <MessageBubble
                  key={m.id}
                  msg={m}
                  onCopy={copy}
                  onRegenerate={regenerate}
                  onNavigateAlternative={navigateAlternative}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Bar - stays at bottom */}
      <InputBar
        onSend={(text, attachments) => send(text, attachments)}
        disabled={!hasDeployment}
        disabledMessage="Please select a model deployment above to start chatting"
      />

      <SettingsDrawer open={openSettings} onClose={() => setOpenSettings(false)} />
    </div>
  );
}
