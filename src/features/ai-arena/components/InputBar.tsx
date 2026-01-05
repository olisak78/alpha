import { Paperclip, ArrowUp, X, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { type UploadedFile } from "@/services/aiPlatformApi";
import { useToast } from "@/hooks/use-toast";

interface InputBarProps {
  onSend: (text: string, attachments?: UploadedFile[]) => void;
  disabled?: boolean;
  disabledMessage?: string;
}

// Text file detection configuration
const TEXT_FILE_MIME_TYPES = ['text/', 'application/json', 'application/xml'];
const TEXT_FILE_EXTENSIONS = ['.txt', '.json', '.html', '.csv', '.xml', '.yaml', '.yml', '.md'];

const isTextFile = (file: File): boolean => {
  return TEXT_FILE_MIME_TYPES.some(type => file.type.startsWith(type)) ||
         TEXT_FILE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
};

export function InputBar({ onSend, disabled = false, disabledMessage }: InputBarProps) {
  const [value, setValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Maximum combined size: 5MB
  const MAX_TOTAL_SIZE = 5 * 1024 * 1024;

  const getTotalSize = (files: File[]) => {
    return files.reduce((total, file) => total + file.size, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check combined size
    const newTotalSize = getTotalSize([...attachedFiles, ...files]);
    if (newTotalSize > MAX_TOTAL_SIZE) {
      toast({
        title: "Files too large",
        description: `Combined file size (${formatFileSize(newTotalSize)}) exceeds 5MB limit`,
        variant: "destructive",
      });
      return;
    }

    // Process files client-side (convert to base64)
    try {
      const processedFiles: UploadedFile[] = [];

      for (const file of files) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        processedFiles.push({
          url: base64,
          mimeType: file.type || 'application/octet-stream',
          filename: file.name,
          size: file.size,
        });
      }

      setUploadedFiles(prev => [...prev, ...processedFiles]);
      setAttachedFiles(prev => [...prev, ...files]);

      toast({
        title: "Files attached",
        description: `${files.length} file(s) attached successfully`,
      });
    } catch (error) {
      toast({
        title: "File processing failed",
        description: error instanceof Error ? error.message : "Failed to process files",
        variant: "destructive",
      });
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submit = () => {
    const text = ref.current?.value?.trim() || "";
    if (!text && uploadedFiles.length === 0) return;

    if (disabled) {
      toast({
        title: "Cannot send message",
        description: disabledMessage || "Please select a model deployment first",
        variant: "destructive",
      });
      return;
    }

    onSend(text, uploadedFiles.length > 0 ? uploadedFiles : undefined);

    // Clear everything
    if (ref.current) {
      ref.current.value = "";
      ref.current.style.height = "auto";
    }
    setValue("");
    setAttachedFiles([]);
    setUploadedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const canSend = (value.trim().length > 0 || uploadedFiles.length > 0) && !disabled;
  const totalSize = getTotalSize(attachedFiles);

  return (
    <div className="px-2 py-3 md:px-3">
      <div className="mx-auto max-w-4xl">
        <div className="flex gap-4 md:gap-6">
          {/* Avatar space placeholder to match MessageBubble layout */}
          <div className="w-8 shrink-0" />

          {/* Content area */}
          <div className="flex-1">
            {/* Disabled state warning */}
            {disabled && disabledMessage && (
              <div className="mb-2 text-sm text-amber-600 dark:text-amber-500 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {disabledMessage}
              </div>
            )}
            {/* File attachments preview */}
            {attachedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => {
              const isImage = file.type && file.type.startsWith('image/');
              const isText = isTextFile(file);

              return (
                <div
                  key={index}
                  className="relative group flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                >
                  {isImage && uploadedFiles[index]?.url ? (
                    <img
                      src={uploadedFiles[index].url}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
                      <FileIcon className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {isText ? 'Text' : isImage ? 'Image' : 'File'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              );
            })}
            <div className="text-xs text-gray-500 self-center">
              {formatFileSize(totalSize)} / 5 MB
            </div>
          </div>
        )}

        <div className="relative flex items-center gap-2 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2F2F2F] px-4 py-3 shadow-sm focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.json,.html,.htm,.csv,.xml,.yaml,.yml,.md,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Attachment button */}
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Attach files"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Paperclip className={`h-5 w-5 ${disabled ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`} />
          </Button>

          {/* Textarea */}
          <textarea
            ref={ref}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Select a model deployment to start chatting..." : "Write Your Message"}
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none max-h-[200px] leading-6 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ minHeight: "24px" }}
          />

          {/* Send button */}
          <Button
            className={`h-8 w-8 p-0 shrink-0 rounded-lg transition-colors ${
              canSend
                ? "bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200"
                : "bg-gray-200 dark:bg-gray-700 cursor-not-allowed"
            }`}
            disabled={!canSend}
            onClick={submit}
            title="Send message"
          >
            <ArrowUp className={`h-5 w-5 ${canSend ? "text-white dark:text-black" : "text-gray-400 dark:text-gray-500"}`} />
          </Button>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}