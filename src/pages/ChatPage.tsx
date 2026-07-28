import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  MessageSquare, 
  Users, 
  Search, 
  Smile, 
  Reply,
  Copy,
  Pencil,
  Trash2,
  Check,
  CheckCheck,
  UserPlus,
  Hash,
  ExternalLink,
  Circle,
  Paperclip,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageTransition } from "@/components/shared/PageTransition";
import { SafeAvatar } from "@/components/shared/SafeAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCollection } from "@/hooks/useCollection";
import { COLLECTIONS, db } from "@/lib/firebase";
import type { ChatMessage, User } from "@/types";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ROOM_ID = "general";
const MAX_MESSAGE_LENGTH = 1000;

// Memoized Message Bubble Component
const MessageBubble = memo(({ 
  message, 
  isOwn, 
  isFirstInGroup, 
  showAvatar, 
  userPhoto,
  onReply,
  onCopy,
  onEdit,
  onDelete
}: any) => {
  const [showActions, setShowActions] = useState(false);
  
  const linkify = useCallback((text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part: string, i: number) => {
      if (urlRegex.test(part)) {
            return (
          <span key={i}>
            <a 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={cn(
                "underline break-all",
                isOwn ? "text-blue-200 hover:text-white" : "text-blue-600 hover:text-blue-800"
              )}
            >
              {part}
            </a>
            {/* Link Preview Card */}
            <div className={cn(
              "mt-2 rounded-xl border p-3 transition-colors",
              isOwn 
                ? "bg-white/10 border-white/20 hover:bg-white/20" 
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center text-white text-lg font-bold",
                    isOwn ? "bg-gradient-to-br from-blue-400 to-indigo-400" : "bg-gradient-to-br from-blue-500 to-indigo-500"
                  )}>
                    {new URL(part).hostname.replace('www.', '').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", isOwn ? "text-white" : "text-slate-900")}>
                      {new URL(part).hostname.replace('www.', '').split('.')[0]}
                    </p>
                    <p className={cn("text-xs", isOwn ? "text-blue-200" : "text-slate-500")}>
                      {new URL(part).hostname.replace('www.', '')}
                    </p>
                  </div>
                </div>
                <ExternalLink className={cn("h-4 w-4", isOwn ? "text-blue-200" : "text-slate-400")} />
              </div>
            </div>
          </span>
        );
      }
      return part;
    });
  }, [isOwn]);

  const time = message.createdAt?.toDate?.() || new Date();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3 group", isOwn && "flex-row-reverse")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {showAvatar ? (
        <div className="relative">
          <SafeAvatar 
            src={userPhoto} 
            name={message.senderName} 
            className="h-8 w-8 shrink-0 mt-1 ring-2 ring-white" 
          />
          {/* Status indicator - simplified for demo */}
          <Circle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 fill-white stroke-white" />
        </div>
      ) : (
        <div className="h-8 w-8 shrink-0 mt-1" />
      )}
      
      <div className={cn("flex flex-col", isOwn && "items-end")}>
        {isFirstInGroup && (
          <div className={cn("flex items-center gap-2 mb-0.5", isOwn && "flex-row-reverse")}>
            <span className="text-xs font-medium text-slate-700">{message.senderName}</span>
            <span className="text-[10px] text-slate-400">
              {time.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        
        <div className="relative max-w-[70%]">
          <div className={cn(
            "rounded-2xl px-4 py-2.5 text-sm break-words transition-all",
            isOwn 
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20" 
              : "bg-white border border-slate-200 shadow-sm hover:shadow-md text-slate-800"
          )}>
            {linkify(message.text)}
          </div>
          
          {/* Message Actions */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                className={cn(
                  "absolute -top-3 bg-white border border-slate-200 rounded-full shadow-lg px-2 py-1 flex gap-0.5",
                  isOwn ? "right-0" : "left-0"
                )}
              >
                <button className="hover:bg-slate-100 rounded-full p-1 transition-colors" aria-label="React">
                  <Smile className="h-3 w-3 text-slate-500" />
                </button>
                <button className="hover:bg-slate-100 rounded-full p-1 transition-colors" onClick={onReply} aria-label="Reply">
                  <Reply className="h-3 w-3 text-slate-500" />
                </button>
                <button className="hover:bg-slate-100 rounded-full p-1 transition-colors" onClick={onCopy} aria-label="Copy">
                  <Copy className="h-3 w-3 text-slate-500" />
                </button>
                {isOwn && (
                  <>
                    <button className="hover:bg-slate-100 rounded-full p-1 transition-colors" onClick={onEdit} aria-label="Edit">
                      <Pencil className="h-3 w-3 text-slate-500" />
                    </button>
                    <button className="hover:bg-red-100 rounded-full p-1 transition-colors" onClick={onDelete} aria-label="Delete">
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Read Status */}
        {isOwn && (
          <div className="flex items-center gap-0.5 mt-0.5 text-xs text-slate-400">
            {message.readBy?.length > 1 ? (
              <CheckCheck className="h-3 w-3 text-blue-500" />
            ) : message.readBy?.length === 1 ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

// Memoized Date Separator
const DateSeparator = memo(({ date }: { date: Date }) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  let label = '';
  if (date >= today) label = 'Today';
  else if (date >= yesterday) label = 'Yesterday';
  else label = date.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-4 my-6"
    >
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-200" />
      <span className="text-xs font-medium text-slate-400 whitespace-nowrap tracking-wider">
        ──────── {label} ────────
      </span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-200" />
    </motion.div>
  );
});

DateSeparator.displayName = 'DateSeparator';

// Member List Item
const MemberItem = memo(({ user, status }: { user: User; status: "online" | "away" | "offline" }) => {
  const statusConfig = {
    online: {
      dot: "bg-emerald-500",
      ring: "ring-emerald-500/20",
      label: "Online",
    },
    away: {
      dot: "bg-amber-500",
      ring: "ring-amber-500/20",
      label: "Away",
    },
    offline: {
      dot: "bg-slate-400",
      ring: "ring-slate-400/20",
      label: "Offline",
    },
  };

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50 transition-all">
      <div className="relative flex-shrink-0">
        <SafeAvatar
          src={user.profilePhotoUrl}
          name={user.fullName}
          className={cn("h-10 w-10 ring-2", statusConfig[status].ring)}
        />

        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
            statusConfig[status].dot
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {user.fullName}
        </p>

        <div className="flex items-center gap-1">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              statusConfig[status].dot
            )}
          />

          <span className="truncate text-xs text-slate-500">
            {statusConfig[status].label}
          </span>
        </div>
      </div>
    </div>
  );
});

MemberItem.displayName = 'MemberItem';

export default function ChatPage() {
  const { userProfile } = useAuth();
  const { data: users } = useCollection<User>(COLLECTIONS.users);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Online status mock (using collection data for demo)
  const userStatuses = useMemo(() => {
  const statusMap: Record<string, "online" | "away" | "offline"> = {};

      users?.forEach((user) => {
        switch (user.status) {
          case "active":
            statusMap[user.id] = "online";
            break;
          case "away":
            statusMap[user.id] = "away";
            break;
          default:
            statusMap[user.id] = "offline";
            break;
        }
      });

      return statusMap;
    }, [users]);

  const onlineCount = useMemo(() => {
    return Object.values(userStatuses).filter(s => s === 'online').length;
  }, [userStatuses]);

  useEffect(() => {
    setDoc(doc(db, COLLECTIONS.chatRooms, ROOM_ID), { 
      name: "General", 
      lastMessageAt: serverTimestamp() 
    }, { merge: true });
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.messages),
      where("roomId", "==", ROOM_ID),
      orderBy("createdAt", "asc"),
      limit(200)
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage));
    });
    return unsub;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || !userProfile || sending) return;
    if (text.length > MAX_MESSAGE_LENGTH) return;
    
    setSending(true);
    try {
      const senderId = userProfile.uid ?? userProfile.id;
      const senderName = userProfile.fullName ?? userProfile.email ?? senderId;
      await addDoc(collection(db, COLLECTIONS.messages), {
        roomId: ROOM_ID,
        senderId,
        senderName,
        text: text.trim(),
        readBy: [senderId],
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, COLLECTIONS.chatRooms, ROOM_ID), { 
        lastMessageAt: serverTimestamp() 
      });
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setSending(false);
    }
  }, [text, userProfile, sending]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const autoGrow = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  }, []);

  const getUserPhoto = useCallback((senderId: string) => {
    return users?.find((u) => u.id === senderId)?.profilePhotoUrl;
  }, [users]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Group messages by date and sender
  const groupedMessages = useMemo(() => {
    const groups: { date: Date; messages: ChatMessage[] }[] = [];
    let currentDate: Date | null = null;
    let currentGroup: ChatMessage[] = [];

    messages.forEach((msg, index) => {
      const createdAt = msg.createdAt;
      const msgDate = createdAt && typeof createdAt !== "string" && "toDate" in createdAt
        ? createdAt.toDate()
        : createdAt instanceof Date
          ? createdAt
          : new Date();
      const msgDateOnly = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
      
      if (!currentDate || msgDateOnly.getTime() !== currentDate.getTime()) {
        if (currentGroup.length) {
          groups.push({ date: currentDate!, messages: [...currentGroup] });
        }
        currentDate = msgDateOnly;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
      
      if (index === messages.length - 1 && currentGroup.length) {
        groups.push({ date: currentDate!, messages: [...currentGroup] });
      }
    });

    return groups;
  }, [messages]);

  const isOwn = useCallback((senderId: string) => {
    return senderId === (userProfile?.uid ?? userProfile?.id ?? "");
  }, [userProfile]);

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Members Sidebar */}
        <motion.div 
          initial={{ width: showMembers ? 280 : 0 }}
          animate={{ width: showMembers ? 280 : 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "shrink-0 overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col",
            !showMembers && "w-0 border-0"
          )}
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-900">Members</span>
              <Badge variant="secondary" className="ml-1">{users?.length || 0}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-500">{onlineCount} online</span>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {users?.map((user) => (
                <MemberItem
                  key={user.id}
                  user={user}
                  status={
                    user.status === "active"
                      ? "online"
                      : user.status === "away"
                      ? "away"
                      : "offline"
                  }
                />
              ))}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Sticky Header */}
          <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="lg:hidden"
                onClick={() => setShowMembers(!showMembers)}
              >
                <Users className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">General Chat</h2>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{users?.length || 0} members</span>
                  <span className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {onlineCount} online
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowMembers(!showMembers)}
                className="hidden lg:flex"
              >
                <UserPlus className="h-4 w-4 text-slate-500" />
              </Button>
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 bg-slate-50/50">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full py-16 text-center"
              >
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No conversations yet</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  Start the discussion with your team. Send a message to begin collaborating.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-1">
                {groupedMessages.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    <DateSeparator date={group.date} />
                    {group.messages.map((msg, msgIndex) => {
                      const isOwnMessage = isOwn(msg.senderId);
                      const isFirstInGroup = msgIndex === 0 || group.messages[msgIndex - 1].senderId !== msg.senderId;
                      const showAvatar = isFirstInGroup;
                      
                      return (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          isOwn={isOwnMessage}
                          isFirstInGroup={isFirstInGroup}
                          showAvatar={showAvatar}
                          userPhoto={getUserPhoto(msg.senderId)}
                          onReply={() => setText(`> ${msg.text}\n\n`)}
                          onCopy={() => handleCopy(msg.text)}
                          onEdit={() => {}}
                          onDelete={() => {}}
                        />
                      );
                    })}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-slate-200 p-4 bg-white">
            <form onSubmit={sendMessage} className="relative">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <div className="absolute left-3 bottom-3 flex items-center gap-0.5">
                    <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOCuzHgCXlBsGLR4zFuT1kE9Ml-1WWsSW77TFpw_Fxz7X0WVkQE7m9ADQ&s=10"
                        alt="SIH Logo"
                        className="h-10 w-auto object-contain"
                    />
                  </div>
                  
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={autoGrow}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Shift+Enter for new line)"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-14 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '150px' }}
                    maxLength={MAX_MESSAGE_LENGTH}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!text.trim() || sending}
                  className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-1.5 flex items-center justify-between px-1">
                <span className="text-[10px] text-slate-400">
                  {text.trim() ? `${text.length} / ${MAX_MESSAGE_LENGTH}` : 'Press Enter to send'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Shift+Enter for new line
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}