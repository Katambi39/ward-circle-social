import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Minimize2, Maximize2, Sparkles, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type Verdict = "verified" | "misleading" | "false" | "unverified";

type VerifyResult = {
  verdict: Verdict;
  confidence: number;
  summary: string;
  details: string;
  sources_note: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  verification?: VerifyResult;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

// ── Streaming helper (chat mode) ──
async function streamChat({
  messages,
  onDelta,
  onDone,
  signal,
}: {
  messages: { role: string; content: string }[];
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
    body: JSON.stringify({ messages, mode: "chat" }),
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

// ── Verify helper (non-streaming) ──
async function verifyClaim(claim: string, signal?: AbortSignal): Promise<VerifyResult> {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ mode: "verify", claim }),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Verification failed" }));
    throw new Error(err.error || "Verification failed");
  }

  const data = await resp.json();
  return data.result as VerifyResult;
}

// ── Verdict UI helpers ──
const verdictConfig: Record<Verdict, { icon: typeof ShieldCheck; label: string; color: string; bg: string }> = {
  verified: { icon: ShieldCheck, label: "Verified", color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  misleading: { icon: ShieldAlert, label: "Misleading", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  false: { icon: ShieldX, label: "False", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  unverified: { icon: ShieldQuestion, label: "Unverified", color: "text-muted-foreground", bg: "bg-muted border-border" },
};

function VerificationBadge({ result }: { result: VerifyResult }) {
  const [expanded, setExpanded] = useState(false);
  const config = verdictConfig[result.verdict];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-xl border p-3 mt-1", config.bg)}>
      <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-2 w-full text-left">
        <Icon className={cn("h-5 w-5 shrink-0", config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("font-display font-semibold text-xs", config.color)}>{config.label}</span>
            <span className="text-[10px] text-muted-foreground">({result.confidence}% confidence)</span>
          </div>
          <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">{result.summary}</p>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="prose prose-sm dark:prose-invert max-w-none text-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{result.details}</ReactMarkdown>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic">📚 {result.sources_note}</p>
        </div>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  "How do I create a post?",
  "What is Toboa Siri?",
  "How does the marketplace work?",
  "Tell me about locality groups",
];

const VERIFY_SUGGESTIONS = [
  "Kenya's population is 60 million",
  "Nairobi is the capital of Kenya",
  "M-Pesa was launched in 2005",
  "Mount Kenya is the tallest mountain in Africa",
];

type Mode = "chat" | "verify";

const AiChatBox = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  const sendChat = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    abortRef.current = new AbortController();
    let assistantSoFar = "";

    try {
      await streamChat({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        signal: abortRef.current.signal,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && !last.verification) {
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
      toast({ title: "AI Error", description: (e as Error)?.message || "Something went wrong", variant: "destructive" });
    }
  };

  const sendVerify = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: `🔍 Verify: "${trimmed}"` };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    abortRef.current = new AbortController();

    try {
      const result = await verifyClaim(trimmed, abortRef.current.signal);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.summary, verification: result },
      ]);
    } catch (e: unknown) {
      if ((e as Error)?.name === "AbortError") return;
      toast({ title: "Verification Error", description: (e as Error)?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const send = (text: string) => {
    if (mode === "verify") return sendVerify(text);
    return sendChat(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const currentSuggestions = mode === "verify" ? VERIFY_SUGGESTIONS : SUGGESTIONS;

  const closeChat = () => {
    setOpen(false);
    setMinimized(false);
  };

  return (
    <>
      {/* Backdrop - click to close */}
      {open && !minimized && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none"
          onClick={closeChat}
          aria-hidden="true"
        />
      )}

      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 z-50 rounded-full gradient-kenya shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
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
              : "bottom-20 md:bottom-6 w-[340px] sm:w-[380px] h-[560px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border rounded-t-2xl bg-muted/50 shrink-0">
            <div className="h-7 w-7 rounded-full gradient-kenya flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm leading-none">Conect AI</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {mode === "verify" ? "Fact-check mode · Verify claims" : "Your Kenyan social assistant"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={clearChat} title="New chat">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setMinimized((v) => !v)}>
                {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
                onClick={closeChat}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Mode toggle */}
              <div className="flex gap-1 px-3 pt-2 pb-1 shrink-0">
                <button
                  onClick={() => setMode("chat")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-medium transition-colors",
                    mode === "chat"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sparkles className="h-3 w-3" /> Chat
                </button>
                <button
                  onClick={() => setMode("verify")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-medium transition-colors",
                    mode === "verify"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ShieldCheck className="h-3 w-3" /> Verify
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-2">
                    <div className="h-12 w-12 rounded-full gradient-kenya flex items-center justify-center">
                      {mode === "verify" ? (
                        <Search className="h-6 w-6 text-primary-foreground" />
                      ) : (
                        <Bot className="h-6 w-6 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      {mode === "verify" ? (
                        <>
                          <p className="font-display font-semibold text-sm">Fact-Check Mode</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Paste a claim, headline, or post to verify its accuracy. I'll analyze it and give you a verdict.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-display font-semibold text-sm">Habari! I'm Conect AI</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ask me anything about Conect or get help with your community.
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                      {currentSuggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="text-xs text-left px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-foreground/80 border border-border"
                        >
                          {mode === "verify" ? `🔍 ${s}` : s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="h-6 w-6 rounded-full gradient-kenya flex items-center justify-center shrink-0 mr-2 mt-0.5">
                        {msg.verification ? (
                          (() => {
                            const V = verdictConfig[msg.verification.verdict].icon;
                            return <V className="h-3 w-3 text-primary-foreground" />;
                          })()
                        ) : (
                          <Sparkles className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] px-3 py-2 rounded-2xl text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        msg.verification ? (
                          <VerificationBadge result={msg.verification} />
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none text-inherit [&>*]:text-inherit [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="h-6 w-6 rounded-full gradient-kenya flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      {mode === "verify" ? (
                        <ShieldCheck className="h-3 w-3 text-primary-foreground animate-pulse" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                      <div className="flex gap-1 items-center h-4">
                        <span className="text-[10px] text-muted-foreground mr-1">
                          {mode === "verify" ? "Verifying..." : "Thinking..."}
                        </span>
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
                    placeholder={mode === "verify" ? "Paste a claim to verify..." : "Ask anything..."}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    className="h-7 w-7 rounded-full gradient-kenya shrink-0"
                    onClick={() => send(input)}
                    disabled={!input.trim() || isLoading}
                  >
                    {mode === "verify" ? (
                      <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground" />
                    ) : (
                      <Send className="h-3.5 w-3.5 text-primary-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-center text-[9px] text-muted-foreground mt-1.5">
                  {mode === "verify"
                    ? "AI fact-check · Results may not be 100% accurate"
                    : "Powered by Conect AI · May make mistakes"}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AiChatBox;
