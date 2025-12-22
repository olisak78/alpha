import { Copy, Sparkles, RotateCcw, Check, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message } from "../types/chat";
import { useState, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypePrism from "rehype-prism-plus";
import Prism from "@/lib/prism-languages"; // Load Prism core and language grammars
import "prismjs/themes/prism-tomorrow.css";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/hooks/api/useMembers";
import { preprocessMessageContent } from "../lib/helpers";

export function MessageBubble({
  msg,
  onCopy,
  onRegenerate,
  onNavigateAlternative
}: {
  msg: Message;
  onCopy: (text: string) => void;
  onRegenerate?: () => void;
  onNavigateAlternative?: (messageId: string, direction: 'prev' | 'next') => void;
}) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState<{ [key: string]: boolean }>({});
  const codeBlockCounter = useRef(0);
  const { user } = useAuth();

  // Fetch current user data to get first_name and last_name
  const { data: memberData } = useCurrentUser({
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const userInitials = useMemo(() => {
    if (memberData?.first_name && memberData?.last_name) {
      return `${memberData.first_name[0]}${memberData.last_name[0]}`.toUpperCase();
    }

    // Fallback to splitting the name
    if (user?.name) {
      return user.name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    return null; // Return null to show icon instead
  }, [memberData?.first_name, memberData?.last_name, user?.name]);

  const handleCopy = async () => {
    await onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeCopy = async (code: string, index: string) => {
    await navigator.clipboard.writeText(code);
    setCodeCopied({ ...codeCopied, [index]: true });
    setTimeout(() => setCodeCopied({ ...codeCopied, [index]: false }), 2000);
  };

  return (
    <div className={`group ${!isUser ? "border-b border-gray-100 dark:border-gray-800" : ""} last:border-0`}>
      <div className="max-w-4xl mx-auto px-2 py-6 md:px-3">
        <div className="flex gap-4 md:gap-6">
          {/* Avatar */}
          {isUser ? (
            userInitials ? (
              <span className="relative flex shrink-0 overflow-hidden rounded-full h-8 w-8">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-900 dark:text-gray-100">
                  {userInitials}
                </span>
              </span>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#19C37D] text-white">
                <User className="h-4 w-4" />
              </div>
            )
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#AB68FF] text-white">
              <Sparkles className="h-4 w-4" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 space-y-3 overflow-hidden pt-1">
            {msg.isRegenerating ? (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 py-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm">Generating response...</span>
              </div>
            ) : (
              <div className={`prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-100 prose-code:before:content-none prose-code:after:content-none [&_p]:leading-7 [&_p]:mb-4 [&_p]:text-[15px] [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mb-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1 [&_hr]:my-8 [&_hr]:border-gray-200 [&_hr]:dark:border-gray-700 ${msg.isStreaming ? 'typing-cursor' : ''}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[[rehypePrism, { ignoreMissing: true }]]}
                  components={{
                    pre({ node, children, ...props }) {
                      // Extract text content recursively from children
                      const extractText = (node: unknown): string => {
                        if (typeof node === 'string') return node;
                        if (Array.isArray(node)) return node.map(extractText).join('');
                        if (node && typeof node === 'object' && 'props' in node) {
                          const element = node as React.ReactElement;
                          if (element.props?.children) return extractText(element.props.children);
                        }
                        return '';
                      };

                      // Extract language and code from the pre > code structure
                      const codeElement = children as React.ReactElement;
                      const className = codeElement?.props?.className || "";
                      const match = /language-(\w+)/.exec(className);
                      let language = match ? match[1] : "";
                      const codeString = extractText(codeElement);

                      // Detect if the specified language is incorrect and fix it
                      let wasAutoDetected = false;

                      // Check for common misclassifications (e.g., Go code marked as Java)
                      if (language === "java" && /package main|func\s+\w+\(|import\s+\(/m.test(codeString)) {
                        language = "go";
                        wasAutoDetected = true;
                      }

                      // If no language specified, try to auto-detect common patterns
                      if (!language || language === "text" || language === "plaintext") {
                        // Simple heuristics for common languages
                        if (/^(import|package|public\s+class|private\s+class)/m.test(codeString)) {
                          language = "java";
                          wasAutoDetected = true;
                        } else if (/^(def |import |class |from .+ import)/m.test(codeString)) {
                          language = "python";
                          wasAutoDetected = true;
                        } else if (/^(const |let |var |function |import .+ from|export )/m.test(codeString)) {
                          language = "javascript";
                          wasAutoDetected = true;
                        } else if (/^(interface |type |export |import )/m.test(codeString)) {
                          language = "typescript";
                          wasAutoDetected = true;
                        } else if (/^(func |package main|import \()/m.test(codeString)) {
                          language = "go";
                          wasAutoDetected = true;
                        } else if (/^(<\?php|namespace |use |class )/m.test(codeString)) {
                          language = "php";
                          wasAutoDetected = true;
                        } else if (/^(SELECT |INSERT |UPDATE |DELETE |CREATE TABLE)/im.test(codeString)) {
                          language = "sql";
                          wasAutoDetected = true;
                        } else if (/^(\{|\[)/.test(codeString.trim()) && /[\{\}\[\]:,]/.test(codeString)) {
                          language = "json";
                          wasAutoDetected = true;
                        } else {
                          language = "text";
                        }
                      }

                      // Use message ID + counter for stable, unique code block identification
                      const codeIndex = `${msg.id}-${codeBlockCounter.current++}`;

                      // If we auto-detected the language, manually apply Prism highlighting
                      let highlightedChildren = children;
                      if (wasAutoDetected && language !== "text" && Prism.languages[language]) {
                        try {
                          const highlighted = Prism.highlight(codeString, Prism.languages[language], language);
                          highlightedChildren = <code className={`language-${language} !text-[13px]`} dangerouslySetInnerHTML={{ __html: highlighted }} />;
                        } catch (e) {
                          console.warn(`Failed to highlight ${language}:`, e);
                        }
                      }

                      return (
                        <div className="relative rounded-2xl overflow-hidden my-4 bg-[#2F2F2F]">
                          <div className="flex items-center justify-between bg-[#2F2F2F] px-4 py-2.5 text-xs">
                            <span className="text-white/70 font-medium">{language}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2.5 hover:bg-white/10 text-white/70 hover:text-white"
                              onClick={() => handleCodeCopy(codeString, codeIndex)}
                            >
                              {codeCopied[codeIndex] ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              <span className="ml-1.5">{codeCopied[codeIndex] ? 'Copied!' : 'Copy code'}</span>
                            </Button>
                          </div>
                          <div className="overflow-x-auto">
                            <pre className="!m-0 !p-4 !bg-[#2F2F2F] !text-gray-100 !text-[13px] !leading-relaxed" {...props}>
                              {highlightedChildren}
                            </pre>
                          </div>
                        </div>
                      );
                    },
                    code({ node, inline, className, children, ...props }: any) {
                      // Inline code
                      if (inline) {
                        return (
                          <code
                            className="bg-black/5 dark:bg-white/10 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 rounded font-mono text-[13px] font-normal"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }
                      // Block code - let it be wrapped by pre component
                      return (
                        <code className={`${className} !text-[13px]`} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {preprocessMessageContent(msg.content)}
                </ReactMarkdown>
              </div>
            )}

            {/* Action buttons - only show for assistant messages */}
            {!isUser && !msg.isRegenerating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    className="h-7 px-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    variant="ghost"
                    onClick={handleCopy}
                    title="Copy"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  {onRegenerate && (
                    <Button
                      className="h-7 px-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      variant="ghost"
                      onClick={onRegenerate}
                      title="Regenerate"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Alternative answer navigation - only show if we have more than 1 answer */}
                {msg.alternatives && msg.alternatives.length > 1 && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 ml-2">
                    <Button
                      className="h-7 w-7 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                      variant="ghost"
                      onClick={() => onNavigateAlternative?.(msg.id, 'prev')}
                      disabled={(msg.currentAlternativeIndex ?? 0) === 0}
                      title="Previous answer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="min-w-[3rem] text-center">
                      {(msg.currentAlternativeIndex ?? 0) + 1} / {msg.alternatives.length}
                    </span>
                    <Button
                      className="h-7 w-7 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                      variant="ghost"
                      onClick={() => onNavigateAlternative?.(msg.id, 'next')}
                      disabled={(msg.currentAlternativeIndex ?? 0) >= msg.alternatives.length - 1}
                      title="Next answer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}