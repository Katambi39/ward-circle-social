import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, Minimize2, Maximize2, Sparkles, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, Search, RotateCcw, History, Plus, Trash2, Paperclip, FileText, Image as ImageIcon, Link2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

type Verdict = "verified" | "misleading" | "false" | "unverified";

type VerifyResult = {
  verdict: Verdict;
  confidence: number;
  summary: string;
  details: string;
  sources_note: string;
};

type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  verification?: VerifyResult;
  file_url?: string;
  file_name?: string;
  file_type?: string;
};

type Conversation = {
  id: string;
  title: string;
  mode: string;
  updated_at: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

// ── Streaming helper ──
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

// ── Verify helper ──
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

// ── Verdict UI ──
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

// ── Link detection ──
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;

function MessageContent({ content }: { content: string }) {
  // Replace URLs in user messages with clickable links
  const parts = content.split(URL_REGEX);
  return (
    <span>
      {parts.map((part, i) =>
        URL_REGEX.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all opacity-90 hover:opacity-100">
            {part.length > 40 ? part.slice(0, 37) + "..." : part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function FileAttachment({ url, name, type }: { url: string; name: string; type: string }) {
  const isImage = type?.startsWith("image/");
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border mt-1 hover:bg-background/80 transition-colors">
      {isImage ? (
        <img src={url} alt={name} className="h-12 w-12 rounded object-cover" />
      ) : (
        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground">{isImage ? "Image" : "File"}</p>
      </div>
    </a>
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
type View = "chat" | "history";

const AiChatBox = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [view, setView] = useState<View>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [swipeY, setSwipeY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string; type: string } | null>(null);

  const swipeStartRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // ── Persistence helpers ──
  const getUserId = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id;
  }, []);

  const saveConversation = useCallback(async (convoId: string, title: string, modeVal: string) => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from("ai_conversations").upsert({
      id: convoId,
      user_id: userId,
      title,
      mode: modeVal,
      updated_at: new Date().toISOString(),
    } as any);
  }, [getUserId]);

  const saveMessage = useCallback(async (convoId: string, msg: ChatMessage) => {
    await supabase.from("ai_messages").insert({
      conversation_id: convoId,
      role: msg.role,
      content: msg.content,
      verification: msg.verification ? (msg.verification as any) : null,
      file_url: msg.file_url || null,
      file_name: msg.file_name || null,
      file_type: msg.file_type || null,
    } as any);
  }, []);

  const createNewConvo = useCallback(async (): Promise<string> => {
    const userId = await getUserId();
    if (!userId) return crypto.randomUUID();
    const id = crypto.randomUUID();
    await supabase.from("ai_conversations").insert({
      id,
      user_id: userId,
      title: "New Chat",
      mode,
    } as any);
    return id;
  }, [getUserId, mode]);

  const loadConversations = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50) as any;
    setConversations(data || []);
    setLoadingHistory(false);
  }, [getUserId]);

  const loadConvoMessages = useCallback(async (convoId: string) => {
    const { data } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true }) as any;
    if (data) {
      setMessages(
        data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          verification: m.verification || undefined,
          file_url: m.file_url || undefined,
          file_name: m.file_name || undefined,
          file_type: m.file_type || undefined,
        }))
      );
    }
  }, []);

  const deleteConversation = useCallback(async (convoId: string) => {
    await supabase.from("ai_conversations").delete().eq("id", convoId) as any;
    setConversations((prev) => prev.filter((c) => c.id !== convoId));
    if (activeConvoId === convoId) {
      setActiveConvoId(null);
      setMessages([]);
    }
  }, [activeConvoId]);

  // ── File upload ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }

    setUploadingFile(true);
    try {
      const userId = (await getUserId()) || "anon";
      const path = `${userId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("ai-chat-files").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("ai-chat-files").getPublicUrl(path);
      setPendingFile({ url: urlData.publicUrl, name: file.name, type: file.type });
      toast({ title: "File attached", description: file.name });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Swipe handlers ──
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-swipe-handle]')) {
      swipeStartRef.current = e.touches[0].clientY;
      setSwiping(true);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStartRef.current === null) return;
    const delta = e.touches[0].clientY - swipeStartRef.current;
    if (delta > 0) setSwipeY(delta);
  };
  const handleTouchEnd = () => {
    if (swipeY > 120) closeChat();
    setSwipeY(0);
    setSwiping(false);
    swipeStartRef.current = null;
  };

  useEffect(() => {
    if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, minimized]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape" && open) closeChat(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto-title from first user message ──
  const autoTitle = (text: string) => text.slice(0, 40) + (text.length > 40 ? "..." : "");

  // ── Send chat ──
  const sendChat = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed && !pendingFile) return;
    if (isLoading) return;
    setInput("");

    let convoId = activeConvoId;
    if (!convoId) {
      convoId = await createNewConvo();
      setActiveConvoId(convoId);
    }

    const msgContent = pendingFile
      ? (trimmed ? `${trimmed}\n\n📎 [${pendingFile.name}](${pendingFile.url})` : `📎 Shared file: [${pendingFile.name}](${pendingFile.url})`)
      : trimmed;

    const userMsg: ChatMessage = {
      role: "user",
      content: msgContent,
      file_url: pendingFile?.url,
      file_name: pendingFile?.name,
      file_type: pendingFile?.type,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setPendingFile(null);
    setIsLoading(true);

    // Save user message & update title
    await saveMessage(convoId, userMsg);
    if (messages.length === 0) {
      await saveConversation(convoId, autoTitle(trimmed || pendingFile?.name || "New Chat"), mode);
    } else {
      await saveConversation(convoId, conversations.find(c => c.id === convoId)?.title || autoTitle(trimmed), mode);
    }

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
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        },
        onDone: async () => {
          setIsLoading(false);
          // Save assistant message
          if (assistantSoFar && convoId) {
            await saveMessage(convoId, { role: "assistant", content: assistantSoFar });
          }
        },
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

    let convoId = activeConvoId;
    if (!convoId) {
      convoId = await createNewConvo();
      setActiveConvoId(convoId);
    }

    const userMsg: ChatMessage = { role: "user", content: `🔍 Verify: "${trimmed}"` };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    await saveMessage(convoId, userMsg);
    if (messages.length === 0) {
      await saveConversation(convoId, `Verify: ${autoTitle(trimmed)}`, "verify");
    }

    abortRef.current = new AbortController();

    try {
      const result = await verifyClaim(trimmed, abortRef.current.signal);
      const assistantMsg: ChatMessage = { role: "assistant", content: result.summary, verification: result };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveMessage(convoId, assistantMsg);
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

  const startNewChat = () => {
    setMessages([]);
    setActiveConvoId(null);
    setPendingFile(null);
    abortRef.current?.abort();
    setIsLoading(false);
    setView("chat");
  };

  const openHistory = () => {
    loadConversations();
    setView("history");
  };

  const resumeConversation = async (convo: Conversation) => {
    setActiveConvoId(convo.id);
    setMode(convo.mode as Mode);
    await loadConvoMessages(convo.id);
    setView("chat");
  };

  const currentSuggestions = mode === "verify" ? VERIFY_SUGGESTIONS : SUGGESTIONS;

  const closeChat = () => {
    setOpen(false);
    setMinimized(false);
    setView("chat");
  };

  return (
    <>
      {/* Backdrop */}
      {open && !minimized && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none" onClick={closeChat} aria-hidden="true" />
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={cn(
            "fixed right-4 z-50 flex flex-col bg-card border border-border rounded-2xl shadow-2xl",
            swiping ? "" : "transition-all duration-200",
            minimized ? "bottom-20 md:bottom-6 w-72 h-14" : "bottom-20 md:bottom-6 w-[340px] sm:w-[380px] h-[560px]"
          )}
          style={{
            transform: swipeY > 0 ? `translateY(${swipeY}px)` : undefined,
            opacity: swipeY > 0 ? Math.max(0, 1 - swipeY / 200) : 1,
          }}
        >
          {/* Header */}
          <div data-swipe-handle className="flex items-center gap-2.5 px-4 py-3 border-b border-border rounded-t-2xl bg-muted/50 shrink-0 cursor-grab active:cursor-grabbing">
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-border md:hidden" />
            <div className="h-7 w-7 rounded-full gradient-kenya flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm leading-none">Conect AI</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {view === "history" ? "Chat History" : mode === "verify" ? "Fact-check mode" : "Your Kenyan social assistant"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={openHistory} title="History">
                <History className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={startNewChat} title="New chat">
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setMinimized((v) => !v)}>
                {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive" onClick={closeChat} title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!minimized && view === "history" && (
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <button onClick={() => setView("chat")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
                <ChevronLeft className="h-3 w-3" /> Back to chat
              </button>
              {loadingHistory ? (
                <div className="flex items-center justify-center h-32">
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <History className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground">No chat history yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((c) => (
                    <div key={c.id} className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/80 transition-colors group",
                      activeConvoId === c.id && "bg-muted"
                    )}>
                      <button onClick={() => resumeConversation(c)} className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-medium truncate">{c.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {c.mode === "verify" ? "🔍 Verify" : "💬 Chat"} · {new Date(c.updated_at).toLocaleDateString()}
                        </p>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!minimized && view === "chat" && (
            <>
              {/* Mode toggle */}
              <div className="flex gap-1 px-3 pt-2 pb-1 shrink-0">
                <button
                  onClick={() => setMode("chat")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-medium transition-colors",
                    mode === "chat" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sparkles className="h-3 w-3" /> Chat
                </button>
                <button
                  onClick={() => setMode("verify")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-medium transition-colors",
                    mode === "verify" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
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
                      {mode === "verify" ? <Search className="h-6 w-6 text-primary-foreground" /> : <Bot className="h-6 w-6 text-primary-foreground" />}
                    </div>
                    <div>
                      {mode === "verify" ? (
                        <>
                          <p className="font-display font-semibold text-sm">Fact-Check Mode</p>
                          <p className="text-xs text-muted-foreground mt-1">Paste a claim to verify its accuracy.</p>
                        </>
                      ) : (
                        <>
                          <p className="font-display font-semibold text-sm">Habari! I'm Conect AI</p>
                          <p className="text-xs text-muted-foreground mt-1">Ask me anything. You can also share files and links!</p>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                      {currentSuggestions.map((s) => (
                        <button key={s} onClick={() => send(s)} className="text-xs text-left px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-foreground/80 border border-border">
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
                        {msg.verification ? (() => { const V = verdictConfig[msg.verification.verdict].icon; return <V className="h-3 w-3 text-primary-foreground" />; })() : <Sparkles className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    )}
                    <div className={cn("max-w-[85%] px-3 py-2 rounded-2xl text-sm", msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                      {msg.file_url && msg.file_name && msg.file_type && (
                        <FileAttachment url={msg.file_url} name={msg.file_name} type={msg.file_type} />
                      )}
                      {msg.role === "assistant" ? (
                        msg.verification ? (
                          <VerificationBadge result={msg.verification} />
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none text-inherit [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:text-inherit [&_p]:text-sm [&_p]:leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-1 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-1.5 [&_h3]:mb-0.5 [&_strong]:font-semibold [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4 [&_li]:text-sm [&_li]:my-0.5 [&_code]:text-xs [&_code]:bg-background/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )
                      ) : (
                        <MessageContent content={msg.content} />
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="h-6 w-6 rounded-full gradient-kenya flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      {mode === "verify" ? <ShieldCheck className="h-3 w-3 text-primary-foreground animate-pulse" /> : <Sparkles className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                      <div className="flex gap-1 items-center h-4">
                        <span className="text-[10px] text-muted-foreground mr-1">{mode === "verify" ? "Verifying..." : "Thinking..."}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Pending file preview */}
              {pendingFile && (
                <div className="px-3 pb-1">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border">
                    {pendingFile.type.startsWith("image/") ? <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" /> : <FileText className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className="text-xs truncate flex-1">{pendingFile.name}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => setPendingFile(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="px-3 py-2.5 border-t border-border shrink-0">
                <div className="flex items-center gap-1.5 bg-muted rounded-xl px-3 py-1.5">
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.xlsx" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile || isLoading}
                    title="Attach file (max 10MB)"
                  >
                    {uploadingFile ? (
                      <span className="h-3.5 w-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={mode === "verify" ? "Paste a claim to verify..." : "Ask anything or paste a link..."}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    className="h-7 w-7 rounded-full gradient-kenya shrink-0"
                    onClick={() => send(input)}
                    disabled={(!input.trim() && !pendingFile) || isLoading}
                  >
                    {mode === "verify" ? <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground" /> : <Send className="h-3.5 w-3.5 text-primary-foreground" />}
                  </Button>
                </div>
                <p className="text-center text-[9px] text-muted-foreground mt-1.5">
                  {mode === "verify" ? "AI fact-check · Results may not be 100% accurate" : "Powered by Conect AI · May make mistakes"}
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
