import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  signal,
}: {
  messages: Message[];
  onDelta: (chunk: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({ error: "Failed to connect" }));
    throw new Error(err.error || "Stream failed");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let done = false;

  while (!done) {
    const { done: rd, value } = await reader.read();
    if (rd) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIdx);
      textBuffer = textBuffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }
  onDone();
}

const SUGGESTIONS = [
  "How do I create a post?",
  "What is Toboa Siri?",
  "How does the marketplace work?",
  "Tell me about locality groups",
];

const AiChatBox = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    abortRef.current = new AbortController();
    let assistantSoFar = "";

    try {
      await streamChat({
        messages: newMessages,
        signal: abortRef.current.signal,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
              );
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        },
        onDone: () => setIsLoading(false),
      });
    } catch (e: unknown) {
      if ((e as Error)?.name === "AbortError") return;
      setIsLoading(false);
      toast({
        title: "AI Error",
        description: (e as Error)?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 z-50 h-13 w-13 rounded-full gradient-kenya shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          style={{ height: 52, width: 52 }}
          aria-label="Open AI Assistant"
        >
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed right-4 z-50 flex flex-col bg-card border border-border rounded-2xl shadow-2xl transition-all duration-200",
            minimized
              ? "bottom-20 md:bottom-6 w-72 h-14"
              : "bottom-20 md:bottom-6 w-[340px] sm:w-[380px] h-[520px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border rounded-t-2xl bg-muted/50 shrink-0">
            <div className="h-7 w-7 rounded-full gradient-kenya flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm leading-none">Conect AI</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Your Kenyan social assistant</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => setMinimized((v) => !v)}
              >
                {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => { setOpen(false); setMinimized(false); }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-2">
                    <div className="h-12 w-12 rounded-full gradient-kenya flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-sm">Habari! I'm Conect AI</p>
                      <p className="text-xs text-muted-foreground mt-1">Ask me anything about Conect or get help with your community.</p>
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="text-xs text-left px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-foreground/80 border border-border"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-6 w-6 rounded-full gradient-kenya flex items-center justify-center shrink-0 mr-2 mt-0.5">
                        <Sparkles className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-inherit [&>*]:text-inherit [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="h-6 w-6 rounded-full gradient-kenya flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <Sparkles className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                      <div className="flex gap-1 items-center h-4">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-2.5 border-t border-border shrink-0">
                <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-1.5">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    className="h-7 w-7 rounded-full gradient-kenya shrink-0"
                    onClick={() => send(input)}
                    disabled={!input.trim() || isLoading}
                  >
                    <Send className="h-3.5 w-3.5 text-primary-foreground" />
                  </Button>
                </div>
                <p className="text-center text-[9px] text-muted-foreground mt-1.5">Powered by Conect AI · May make mistakes</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AiChatBox;
