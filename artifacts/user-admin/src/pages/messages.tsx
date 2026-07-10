import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { format } from "date-fns";
import { Send, MessageSquare } from "lucide-react";
import {
  useListConversations,
  useListMessages,
  useSendMessage,
  useListUsers,
  getListConversationsQueryKey,
  getListMessagesQueryKey,
  getListUsersQueryKey,
  type Message,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Messages() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Parse ?with=userId from URL
  const searchParams = new URLSearchParams(search);
  const activeUserId = searchParams.get("with") ? Number(searchParams.get("with")) : null;

  const { data: conversations = [], isLoading: convLoading } = useListConversations({
    query: { queryKey: getListConversationsQueryKey(), refetchInterval: 30000 },
  });

  const { data: messages = [], isLoading: msgsLoading } = useListMessages(
    { withUserId: activeUserId! },
    { query: { queryKey: getListMessagesQueryKey({ withUserId: activeUserId! }), enabled: !!activeUserId } },
  );

  const { data: usersData } = useListUsers(
    { limit: 100 },
    { query: { queryKey: getListUsersQueryKey({ limit: 100 }), enabled: true } },
  );

  const sendMutation = useSendMessage({
    mutation: {
      onSuccess: (newMsg) => {
        queryClient.setQueryData(
          getListMessagesQueryKey({ withUserId: activeUserId! }),
          (old: Message[] = []) => [...old, newMsg],
        );
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        setInput("");
      },
    },
  });

  // Real-time via WebSocket
  useChat({
    onMessage: useCallback((msg: Message) => {
      const otherId = msg.senderId === me?.id ? msg.recipientId : msg.senderId;
      queryClient.setQueryData(
        getListMessagesQueryKey({ withUserId: otherId }),
        (old: Message[] = []) => {
          if (old.some((m) => m.id === msg.id)) return old;
          return [...old, msg];
        },
      );
      queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    }, [me?.id, queryClient]),
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeUser =
    conversations.find((c) => c.user.id === activeUserId)?.user ??
    usersData?.users.find((u) => u.id === activeUserId);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !activeUserId) return;
    sendMutation.mutate({ data: { recipientId: activeUserId, content: text } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Start new conversation: pick any user not already in conversations
  const newUsers =
    usersData?.users.filter(
      (u) => u.id !== me?.id && !conversations.some((c) => c.user.id === u.id),
    ) ?? [];

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-2rem)] -mx-6 md:-mx-10 -my-6 md:-my-10 border border-border rounded-xl overflow-hidden bg-card animate-in fade-in duration-300">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border flex flex-col shrink-0 bg-card">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <h2 className="font-semibold text-sm tracking-tight text-foreground">Messages</h2>
        </div>

        <ScrollArea className="flex-1">
          {convLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {conversations.map((conv) => {
                const isActive = conv.user.id === activeUserId;
                return (
                  <button
                    key={conv.user.id}
                    onClick={() => setLocation(`/messages?with=${conv.user.id}`)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    <Avatar className="h-9 w-9 shrink-0 border border-border/50">
                      <AvatarImage src={conv.user.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs font-semibold bg-primary/5 text-primary">
                        {conv.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-medium truncate">{conv.user.name}</span>
                        {conv.unreadCount > 0 && (
                          <Badge className="h-4 px-1.5 text-[10px] shrink-0">{conv.unreadCount}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage.senderId === me?.id ? "You: " : ""}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </button>
                );
              })}

              {newUsers.length > 0 && (
                <>
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                      New conversation
                    </p>
                  </div>
                  {newUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setLocation(`/messages?with=${u.id}`)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        u.id === activeUserId
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <Avatar className="h-9 w-9 shrink-0 border border-border/50">
                        <AvatarImage src={u.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs font-semibold bg-primary/5 text-primary">
                          {u.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{u.name}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeUserId ? (
          <>
            {/* Header */}
            <div className="h-14 flex items-center gap-3 px-4 border-b border-border shrink-0">
              {activeUser ? (
                <>
                  <Avatar className="h-8 w-8 border border-border/50">
                    <AvatarImage src={activeUser.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs font-semibold bg-primary/5 text-primary">
                      {activeUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold leading-none">{activeUser.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{activeUser.email}</p>
                  </div>
                </>
              ) : (
                <>
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4">
              {msgsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                      <Skeleton className="h-8 w-48 rounded-2xl" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 py-20">
                  <MessageSquare className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((msg, i) => {
                    const isMine = msg.senderId === me?.id;
                    const prevMsg = messages[i - 1];
                    const showTime =
                      !prevMsg ||
                      new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60 * 1000;

                    return (
                      <div key={msg.id}>
                        {showTime && (
                          <div className="flex justify-center my-3">
                            <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2.5 py-0.5 rounded-full">
                              {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-secondary text-secondary-foreground rounded-bl-sm"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border shrink-0">
              <div className="flex gap-2 items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={activeUser ? `Message ${activeUser.name}...` : "Type a message..."}
                  className="flex-1 bg-secondary/30 border-border/60 focus-visible:ring-primary rounded-full px-4"
                  autoComplete="off"
                />
                <Button
                  size="icon"
                  className="shrink-0 rounded-full"
                  onClick={handleSend}
                  disabled={!input.trim() || sendMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageSquare className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">Select a conversation or start a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
