import { Button } from "@/components/ui/button";
import { Trash2, Edit3, MessageSquarePlus } from "lucide-react";
import { useChatCtx } from "./AIPage";
import { useState } from "react";

export default function AILeftPane() {
  const {
    conversations, activeId, setActive, deleteConversation, createConversation, renameConversation
  } = useChatCtx();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleStartEdit = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = async (id: string) => {
    if (editingTitle.trim()) {
      await renameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSaveEdit(id);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleCreateNewChat = () => {
    // Only create a new chat if there isn't already one with "New Chat" title
    const hasNewChat = conversations.some(c => c.title === "New Chat");
    if (!hasNewChat) {
      createConversation("New Chat");
    }
  };

  return (
    <div className="w-[260px] border-r border-gray-200 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-[#0D0D0D] text-gray-900 dark:text-white flex flex-col">
      {/* Header with New Chat button */}
      <div className="p-2 flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          className="h-10 w-full justify-start gap-2 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-900 dark:text-white font-medium"
          onClick={handleCreateNewChat}
        >
          <MessageSquarePlus className="h-5 w-5" />
          New Chat
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2 min-h-0">
        <div className="space-y-0.5 py-2">
          {conversations.map(c => (
            <div
              key={c.id}
              className={`group relative flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${
                c.id === activeId
                  ? "bg-gray-100 dark:bg-white/10"
                  : "hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
              onClick={() => editingId !== c.id && setActive(c.id)}
            >
              <div className="flex-1 min-w-0">
                {editingId === c.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, c.id)}
                    onBlur={() => handleSaveEdit(c.id)}
                    autoFocus
                    className="w-full text-sm bg-transparent border-b border-gray-400 dark:border-gray-500 text-gray-900 dark:text-white/90 focus:outline-none focus:border-gray-600 dark:focus:border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="text-sm truncate text-gray-900 dark:text-white/90">{c.title || "New chat"}</div>
                )}
              </div>
              <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-white/20"
                  onClick={(e) => handleStartEdit(c.id, c.title, e)}
                  title="Rename"
                >
                  <Edit3 className="h-3.5 w-3.5 text-gray-600 dark:text-white/70" />
                </Button>
                <Button
                  variant="ghost"
                  className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(c.id);
                  }}
                  title="Delete chat"
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-600 dark:text-white/70" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
