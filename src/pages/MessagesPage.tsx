import { useState, useEffect, useRef, useCallback } from "react";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare, Send, ArrowLeft, CheckCircle2, Shield, Search,
  Circle, ShieldAlert, Trash2, Paperclip, Loader2, X, FileText, Download,
  Phone, Video,
} from "lucide-react";
import { isExplicitLink } from "@/components/feed/LinkSafety";
import DmLinkWarning from "@/components/messages/DmLinkWarning";
import VoiceNoteRecorder from "@/components/messages/VoiceNoteRecorder";
import VoiceNotePlayer from "@/components/messages/VoiceNotePlayer";
import StickerPicker from "@/components/messages/StickerPicker";
import CallScreen from "@/components/messages/CallScreen";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  page_id: string | null;
  last_message_at: string;
  otherUser?: {
    user_id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
    verification_status: string;
  };
  lastMessage?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_url?: string | null;
  is_read: boolean;
  created_at: string;
}

const MessagesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Call state
  const [activeCall, setActiveCall] = useState<{
    id: string; type: "voice" | "video"; isIncoming: boolean;
    callerId: string; calleeId: string; preAcquiredStream?: MediaStream | null;
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!convos || convos.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get other user profiles
    const otherIds = (convos as any[]).map(c =>
      c.participant_one === user.id ? c.participant_two : c.participant_one
    );
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, verification_status")
      .in("user_id", otherIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    // Get last messages and unread counts
    const enriched = await Promise.all((convos as any[]).map(async (c) => {
      const otherId = c.participant_one === user.id ? c.participant_two : c.participant_one;
      const { data: lastMsg } = await supabase
        .from("direct_messages")
        .select("content")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      const { count } = await supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .eq("is_read", false)
        .neq("sender_id", user.id);
      return {
        ...c,
        otherUser: profileMap.get(otherId),
        lastMessage: lastMsg?.content,
        unreadCount: count || 0,
      };
    }));

    setConversations(enriched);
    setLoading(false);

    // Auto-select conversation from query param
    const convoParam = searchParams.get("convo");
    if (convoParam) {
      const match = enriched.find((c: any) => c.id === convoParam);
      if (match) setSelectedConvo(match);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Fetch messages for selected conversation
  const fetchMessages = async (convoId: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
    setLoadingMessages(false);

    // Mark unread messages as read
    if (user) {
      await supabase
        .from("direct_messages")
        .update({ is_read: true })
        .eq("conversation_id", convoId)
        .eq("is_read", false)
        .neq("sender_id", user.id);
    }

    setTimeout(scrollToBottom, 100);
  };

  // Realtime subscription
  useEffect(() => {
    if (!selectedConvo) return;

    const channel = supabase
      .channel(`messages-${selectedConvo.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${selectedConvo.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          setTimeout(scrollToBottom, 50);

          // Mark as read if not from current user
          if (user && newMsg.sender_id !== user.id) {
            supabase
              .from("direct_messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvo, user]);

  useEffect(() => {
    if (selectedConvo) {
      fetchMessages(selectedConvo.id);
    }
  }, [selectedConvo]);

  // Listen for incoming calls
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("incoming-calls")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "call_signals",
        filter: `callee_id=eq.${user.id}`,
      }, (payload) => {
        const call = payload.new as any;
        if (call.status === "ringing") {
          setIncomingCall(call);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const startCall = async (type: "voice" | "video") => {
    if (!user || !selectedConvo) return;
    const otherId = selectedConvo.participant_one === user.id
      ? selectedConvo.participant_two : selectedConvo.participant_one;
    const { data, error } = await supabase.from("call_signals").insert({
      conversation_id: selectedConvo.id,
      caller_id: user.id,
      callee_id: otherId,
      call_type: type,
      status: "ringing",
    } as any).select().single();
    if (error) {
      toast({ title: "Call failed", description: error.message, variant: "destructive" });
      return;
    }
    setActiveCall({
      id: (data as any).id,
      type,
      isIncoming: false,
      callerId: user.id,
      calleeId: otherId,
    });
  };

  const handleSendSticker = async (stickerUrl: string) => {
    if (!user || !selectedConvo) return;
    setSending(true);
    try {
      await supabase.from("direct_messages").insert({
        conversation_id: selectedConvo.id,
        sender_id: user.id,
        content: "🎨 Sticker",
        media_url: stickerUrl,
      } as any);
      await supabase.from("conversations").update({ last_message_at: new Date().toISOString() } as any).eq("id", selectedConvo.id);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setMediaFile(file);
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setMediaPreview(URL.createObjectURL(file));
    } else {
      setMediaPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearMedia = () => {
    setMediaFile(null);
    if (mediaPreview) { URL.revokeObjectURL(mediaPreview); setMediaPreview(null); }
  };

  const handleSend = async () => {
    if (!user || !selectedConvo || (!newMessage.trim() && !mediaFile)) return;

    // Block explicit/adult content links in DMs
    const urlsInMessage = newMessage.match(/https?:\/\/[^\s)]+/gi) || [];
    if (urlsInMessage.some(u => isExplicitLink(u))) {
      toast({ title: "Blocked", description: "Explicit or adult content links are not allowed.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      let mediaUrl: string | null = null;

      // Upload media if present
      if (mediaFile) {
        setUploadingMedia(true);
        const ext = mediaFile.name.split(".").pop() || "bin";
        const path = `dm/${selectedConvo.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-images").upload(path, mediaFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
        setUploadingMedia(false);
      }

      const { error } = await supabase.from("direct_messages").insert({
        conversation_id: selectedConvo.id,
        sender_id: user.id,
        content: newMessage.trim() || (mediaFile ? "📎 Media" : ""),
        media_url: mediaUrl,
      } as any);
      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() } as any)
        .eq("id", selectedConvo.id);

      setNewMessage("");
      clearMedia();
    } catch (e: any) {
      setUploadingMedia(false);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday " + format(date, "h:mm a");
    return format(date, "MMM d, h:mm a");
  };

  const filteredConvos = conversations.filter((c) =>
    !searchQuery || c.otherUser?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <AppLayout>
      <SEO title="Messages" description="Your direct messages on Conect. Chat privately with friends and connections." path="/messages" />
      <div className="max-w-4xl mx-auto h-[calc(100vh-3.5rem-3.5rem)] md:h-[calc(100vh-3.5rem)] flex">
        {/* Conversation List */}
        <div className={`w-full md:w-80 md:border-r border-border flex flex-col bg-card ${selectedConvo ? "hidden md:flex" : "flex"}`}>
          {/* Header */}
          <div className="p-4 border-b border-border">
            <h1 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Messages
              {totalUnread > 0 && (
                <Badge className="gradient-kenya text-primary-foreground text-xs rounded-full px-2">{totalUnread}</Badge>
              )}
            </h1>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="h-11 w-11 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-28 mb-1.5" />
                      <div className="h-3 bg-muted rounded w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConvos.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-display font-bold text-foreground text-sm mb-1">No messages yet</h3>
                <p className="text-xs text-muted-foreground">Start a conversation from a user's profile or a page.</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredConvos.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConvo(convo)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                      selectedConvo?.id === convo.id
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="relative h-11 w-11 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {convo.otherUser?.avatar_url ? (
                        <img src={convo.otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                          {convo.otherUser?.display_name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      {convo.otherUser?.verification_status === "verified" && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center border border-card">
                          <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-display font-bold text-sm text-foreground truncate flex items-center gap-1">
                          {convo.otherUser?.display_name || "User"}
                          {convo.otherUser?.verification_status === "verified" && (
                            <Shield className="h-3 w-3 text-primary flex-shrink-0" />
                          )}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-display flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: false })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {convo.lastMessage || "No messages yet"}
                        </p>
                        {(convo.unreadCount || 0) > 0 && (
                          <span className="ml-2 h-5 min-w-[1.25rem] rounded-full gradient-kenya text-primary-foreground text-[10px] font-display font-bold flex items-center justify-center px-1.5">
                            {convo.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat View */}
        <div className={`flex-1 flex flex-col bg-background ${!selectedConvo ? "hidden md:flex" : "flex"}`}>
          {selectedConvo ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConvo(null)}
                  className="md:hidden rounded-full p-2 h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="relative h-9 w-9 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {selectedConvo.otherUser?.avatar_url ? (
                    <img src={selectedConvo.otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                      {selectedConvo.otherUser?.display_name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-sm text-foreground flex items-center gap-1">
                    {selectedConvo.otherUser?.display_name || "User"}
                    {selectedConvo.otherUser?.verification_status === "verified" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">@{selectedConvo.otherUser?.username}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary" onClick={() => startCall("voice")}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary" onClick={() => startCall("video")}>
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="space-y-4 py-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                        <div className="h-10 bg-muted rounded-2xl animate-pulse w-48" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-display">
                      Start the conversation! Say hello 👋
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 py-2">
                    <AnimatePresence initial={false}>
                      {messages.map((msg, i) => {
                        const isMe = msg.sender_id === user?.id;
                        const showDate = i === 0 || (
                          new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString()
                        );
                        return (
                          <div key={msg.id}>
                            {showDate && (
                              <div className="flex items-center justify-center my-4">
                                <span className="text-[10px] font-display text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                  {isToday(new Date(msg.created_at)) ? "Today" :
                                    isYesterday(new Date(msg.created_at)) ? "Yesterday" :
                                      format(new Date(msg.created_at), "MMMM d, yyyy")}
                                </span>
                              </div>
                            )}
                            <motion.div
                              initial={{ opacity: 0, y: 6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}
                            >
                              <div className={`group relative max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                isMe
                                  ? "gradient-kenya text-primary-foreground rounded-br-md"
                                  : "bg-card border border-border text-foreground rounded-bl-md"
                              }`}>
                                {isMe && (
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm("Delete this message?")) return;
                                      await supabase.from("direct_messages").delete().eq("id", msg.id);
                                      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                                    }}
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground items-center justify-center hidden group-hover:flex shadow-sm"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                                {/* Media display */}
                                {(msg as any).media_url && (
                                  (() => {
                                    const url = (msg as any).media_url as string;
                                    const isVoiceNote = /voice-notes/.test(url) || (msg.content.startsWith("🎤") && /\.webm(\?|$)/i.test(url));
                                    const isSticker = msg.content === "🎨 Sticker";
                                    const isVideo = /\.(mp4|mov)(\?|$)/i.test(url);
                                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url);
                                    const isDoc = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar)(\?|$)/i.test(url);
                                    const fileName = decodeURIComponent(url.split("/").pop()?.split("?")[0] || "file").replace(/^\d+_[a-z0-9]+\./, "");
                                    if (isVoiceNote) {
                                      return <VoiceNotePlayer url={url} isMe={isMe} />;
                                    } else if (isSticker) {
                                      return <img src={url} alt="Sticker" className="w-28 h-28 object-contain" />;
                                    } else if (isVideo) {
                                      return <video src={url} controls className="rounded-lg max-w-full max-h-48 mt-1" />;
                                    } else if (isImage) {
                                      return <img src={url} alt="" className="rounded-lg max-w-full max-h-48 mt-1 cursor-pointer" onClick={() => window.open(url, "_blank")} />;
                                    } else {
                                      return (
                                        <a href={url} target="_blank" rel="noopener noreferrer"
                                          className={`flex items-center gap-2 mt-1 rounded-lg px-3 py-2 ${isMe ? "bg-white/15" : "bg-muted"}`}
                                        >
                                          <FileText className="h-5 w-5 shrink-0" />
                                          <span className="text-xs font-display truncate flex-1">{isDoc ? fileName : "Attachment"}</span>
                                          <Download className="h-4 w-4 shrink-0 opacity-60" />
                                        </a>
                                      );
                                    }
                                  })()
                                )}
                                {msg.content && msg.content !== "📎 Media" && !msg.content.startsWith("🎤") && msg.content !== "🎨 Sticker" && (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                )}
                                {msg.content === "📎 Media" && !(msg as any).media_url && (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                )}
                                {/* Show link safety warnings for URLs in messages */}
                                {(msg.content.match(/https?:\/\/[^\s)]+/gi) || []).map((url, idx) => (
                                  <DmLinkWarning key={idx} url={url} isMe={isMe} />
                                ))}
                                <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                                  <span className={`text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                    {format(new Date(msg.created_at), "h:mm a")}
                                  </span>
                                  {isMe && msg.is_read && (
                                    <CheckCircle2 className="h-3 w-3 text-primary-foreground/60" />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t border-border bg-card">
                {/* Media preview */}
                {mediaPreview && (
                  <div className="px-4 pt-3 pb-1">
                    <div className="relative inline-block">
                      {mediaFile?.type.startsWith("video/") ? (
                        <video src={mediaPreview} className="h-20 rounded-lg border border-border" />
                      ) : (
                        <img src={mediaPreview} alt="" className="h-20 rounded-lg border border-border object-cover" />
                      )}
                      <button onClick={clearMedia} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
                {mediaFile && !mediaPreview && (
                  <div className="px-4 pt-3 pb-1">
                    <div className="relative inline-flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs text-foreground truncate max-w-[200px]">{mediaFile.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {(mediaFile.size / 1024).toFixed(0)}KB
                      </span>
                      <button onClick={clearMedia} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="p-4 flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar" className="hidden" onChange={handleFileSelect} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full shrink-0 text-muted-foreground hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <StickerPicker onSelect={handleSendSticker} />
                  {newMessage.trim() || mediaFile ? (
                    <>
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="rounded-xl flex-1"
                        disabled={sending}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={sending || (!newMessage.trim() && !mediaFile)}
                        size="sm"
                        className="rounded-xl gradient-kenya text-primary-foreground h-10 w-10 p-0"
                      >
                        {uploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="rounded-xl flex-1"
                        disabled={sending}
                      />
                      <VoiceNoteRecorder
                        conversationId={selectedConvo.id}
                        senderId={user!.id}
                        onSent={() => {}}
                      />
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-20 w-20 rounded-2xl gradient-kenya flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <MessageSquare className="h-10 w-10 text-primary-foreground" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground mb-1">Your Messages</h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Select a conversation or start chatting from a page or profile
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Call Screen */}
      <AnimatePresence>
        {activeCall && selectedConvo?.otherUser && (
          <CallScreen
            callId={activeCall.id}
            conversationId={selectedConvo.id}
            callType={activeCall.type}
            isIncoming={activeCall.isIncoming}
            callerId={activeCall.callerId}
            calleeId={activeCall.calleeId}
            currentUserId={user!.id}
            otherUser={selectedConvo.otherUser}
            onEnd={() => setActiveCall(null)}
          />
        )}
      </AnimatePresence>

      {/* Incoming Call Popup */}
      <AnimatePresence>
        {incomingCall && !activeCall && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-4 min-w-[300px]"
          >
            <div className="h-12 w-12 rounded-full gradient-kenya flex items-center justify-center animate-pulse">
              {incomingCall.call_type === "video" ? (
                <Video className="h-6 w-6 text-primary-foreground" />
              ) : (
                <Phone className="h-6 w-6 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-sm text-foreground">Incoming {incomingCall.call_type} call</p>
              <p className="text-xs text-muted-foreground">Tap to answer</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-destructive hover:bg-destructive/90"
                onClick={async () => {
                  await supabase.from("call_signals").update({ status: "rejected", ended_at: new Date().toISOString() } as any).eq("id", incomingCall.id);
                  setIncomingCall(null);
                }}
              >
                <Phone className="h-4 w-4 text-destructive-foreground rotate-[135deg]" />
              </Button>
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600"
                onClick={() => {
                  // Find the conversation for this call
                  const convo = conversations.find(c => c.id === incomingCall.conversation_id);
                  if (convo) setSelectedConvo(convo);
                  setActiveCall({
                    id: incomingCall.id,
                    type: incomingCall.call_type,
                    isIncoming: true,
                    callerId: incomingCall.caller_id,
                    calleeId: incomingCall.callee_id,
                  });
                  setIncomingCall(null);
                }}
              >
                <Phone className="h-4 w-4 text-white" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default MessagesPage;
