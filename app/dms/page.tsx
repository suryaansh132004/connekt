"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Search,
  Edit3,
  Phone,
  Video,
  Info,
  PlusCircle,
  Smile,
  Send,
  Code2,
  BookOpen,
  ArrowLeft,
  Check,
  CheckCheck,
} from "lucide-react";

/* =========================================================
   🔹 Types
========================================================= */

type SidebarTab = "Chats" | "Communities" | "Collabs";

interface Message {
  id: string;
  text: string;
  from: "me" | "them";
  time: string;
  read?: boolean;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online: "online" | "offline" | "away";
  initials: string;
  color: string;
  subtitle?: string;
  type: "dm" | "collab" | "community";
  messages: Message[];
}

/* =========================================================
   🔹 Mock Data
========================================================= */

const CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    name: "Sarah Jenkins",
    lastMessage: "Did you see the new design specs?",
    time: "Now",
    online: "online",
    initials: "SJ",
    color: "#7CFF8A",
    subtitle: "UX Design Student · 3rd Year",
    type: "dm",
    messages: [
      {
        id: "m1",
        text: "Hey! I was looking at the new component library you pushed. The neon glow effect on the cards is sick! 🔥",
        from: "them",
        time: "10:42 AM",
      },
      {
        id: "m2",
        text: "Thanks! I spent way too much time tweaking the box-shadows haha. Does it look okay on your screen?",
        from: "me",
        time: "10:45 AM",
        read: true,
      },
      {
        id: "m3",
        text: "Yeah, it looks amazing. I did notice one small alignment issue on the mobile view though.",
        from: "them",
        time: "10:48 AM",
      },
      {
        id: "m4",
        text: "Ah, good catch. I probably missed a media query for the flex container. I'll fix that right now.",
        from: "me",
        time: "10:50 AM",
        read: true,
      },
      {
        id: "m5",
        text: "Did you see the new design specs?",
        from: "them",
        time: "Just now",
      },
    ],
  },
  {
    id: "c2",
    name: "David Chen",
    lastMessage: "I'll bring the pizza for the hackathon!",
    time: "5m",
    unread: 2,
    online: "offline",
    initials: "DC",
    color: "#4DEFFF",
    subtitle: "CS · Sophomore",
    type: "dm",
    messages: [
      {
        id: "m1",
        text: "Hey, are you joining the hackathon this weekend?",
        from: "me",
        time: "9:00 AM",
        read: true,
      },
      {
        id: "m2",
        text: "Absolutely! I'll bring the pizza for the hackathon!",
        from: "them",
        time: "9:05 AM",
      },
    ],
  },
  {
    id: "c3",
    name: "React Devs Collab",
    lastMessage: "Alex: pushed the new components.",
    time: "1h",
    online: "online",
    initials: "RD",
    color: "#7CFF8A",
    subtitle: "Collab · 4 members",
    type: "collab",
    messages: [
      {
        id: "m1",
        text: "Alex pushed the new components. Looks clean!",
        from: "them",
        time: "9:30 AM",
      },
      {
        id: "m2",
        text: "Nice, will review after standup.",
        from: "me",
        time: "9:45 AM",
        read: true,
      },
    ],
  },
  {
    id: "c4",
    name: "Mike Ross",
    lastMessage: "Are you going to the campus mixer?",
    time: "3h",
    online: "away",
    initials: "MR",
    color: "#FFD166",
    subtitle: "Mech Engg · Senior",
    type: "dm",
    messages: [
      {
        id: "m1",
        text: "Are you going to the campus mixer tonight?",
        from: "them",
        time: "7:00 AM",
      },
    ],
  },
];

const COMMUNITIES = [
  {
    id: "com1",
    name: "Campus Myths",
    lastMessage: "New ghost sighting reported in Lib...",
    color: "#FF5C8A",
    icon: "👻",
    dot: true,
  },
  {
    id: "com2",
    name: "AI Society",
    lastMessage: "Paper reading this Friday at 6PM",
    color: "#7CFF8A",
    icon: "🤖",
    dot: false,
  },
];

const onlineColor: Record<string, string> = {
  online: "#7CFF8A",
  offline: "#4a4a5a",
  away: "#F59E0B",
};

/* =========================================================
   🔹 Component
========================================================= */

export default function DMsPage() {
  const [selectedId, setSelectedId] = useState<string>("c1");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("Chats");
  const [message, setMessage] = useState("");
  const [conversations, setConversations] =
    useState<Conversation[]>(CONVERSATIONS);
  const [showMobile, setShowMobile] = useState<"sidebar" | "chat">("sidebar");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === selectedId) ?? conversations[0];

  /* ----------------------------
     🔸 Scroll to bottom on new message
  ----------------------------- */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages.length]);

  /* ----------------------------
     🔸 Auto-resize textarea
  ----------------------------- */

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [message]);

  /* ----------------------------
     🔸 Send message
  ----------------------------- */

  const sendMessage = () => {
    if (!message.trim()) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      text: message.trim(),
      from: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: false,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              messages: [...c.messages, newMsg],
              lastMessage: message.trim(),
              time: "Now",
            }
          : c
      )
    );
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectConv = (id: string) => {
    setSelectedId(id);
    setShowMobile("chat");
  };

  /* =========================================================
     🔹 Sidebar
  ========================================================= */

  const Sidebar = (
    <aside
      className="flex flex-col h-full z-20 shrink-0"
      style={{
        background: "rgba(42, 15, 62, 0.95)",
        backdropFilter: "blur(16px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.05)",
        width: "100%",
      }}
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #7CFF8A, #4DEFFF)",
                boxShadow: "0 0 15px rgba(122,255,136,0.4)",
              }}
            >
              <MessageCircle size={20} className="text-[#12001F]" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Messages</h1>
          </div>
          <button className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <Edit3 size={17} className="text-white/60" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            placeholder="Search chats..."
            className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#7CFF8A]/40 transition-colors"
          />
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-black/20 rounded-xl mb-1">
          {(["Chats", "Communities", "Collabs"] as SidebarTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium text-center transition-colors ${
                sidebarTab === tab
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 pb-28 space-y-1">
        {sidebarTab === "Chats" &&
          conversations
            .filter((c) => c.type === "dm")
            .map((conv) => {
              const active = conv.id === selectedId;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConv(conv.id)}
                  className={`w-full p-3 rounded-xl flex gap-3 items-center relative transition-all text-left ${
                    active
                      ? "bg-white/8 border border-white/10"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {/* Active indicator */}
                  {active && (
                    <div
                      className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
                      style={{
                        background: "#7CFF8A",
                        boxShadow: "0 0 8px rgba(122,255,136,0.7)",
                      }}
                    />
                  )}

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{
                        background: `${conv.color}20`,
                        border: `2px solid ${conv.color}40`,
                        color: conv.color,
                      }}
                    >
                      {conv.initials}
                    </div>
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a0530]"
                      style={{ backgroundColor: onlineColor[conv.online] }}
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3
                        className={`text-sm font-semibold truncate ${
                          active ? "text-white" : "text-white/80"
                        }`}
                      >
                        {conv.name}
                      </h3>
                      <span
                        className={`text-[10px] shrink-0 ml-2 ${
                          conv.unread ? "text-[#7CFF8A]" : "text-white/30"
                        }`}
                      >
                        {conv.time}
                      </span>
                    </div>
                    <p
                      className={`text-xs truncate ${
                        conv.unread ? "text-white font-medium" : "text-white/40"
                      }`}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conv.unread && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{
                        background: "#4DEFFF",
                        color: "#12001F",
                        boxShadow: "0 0 8px rgba(77,239,255,0.5)",
                      }}
                    >
                      {conv.unread}
                    </div>
                  )}
                </button>
              );
            })}

        {/* Collabs */}
        {sidebarTab === "Collabs" &&
          conversations
            .filter((c) => c.type === "collab")
            .map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConv(conv.id)}
                className="w-full p-3 rounded-xl flex gap-3 items-center hover:bg-white/5 border border-transparent hover:border-[#7CFF8A]/20 transition-all text-left"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: "#7CFF8A20",
                    border: "1px solid #7CFF8A30",
                  }}
                >
                  <Code2 size={18} className="text-[#7CFF8A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#7CFF8A] truncate">
                    {conv.name}
                  </h3>
                  <p className="text-xs text-white/40 truncate">{conv.lastMessage}</p>
                </div>
              </button>
            ))}

        {/* Communities */}
        {sidebarTab === "Communities" && (
          <>
            <p className="text-xs text-white/30 uppercase tracking-wider font-semibold px-2 pt-2 pb-1">
              Communities
            </p>
            {COMMUNITIES.map((com) => (
              <button
                key={com.id}
                className="w-full p-3 rounded-xl flex gap-3 items-center hover:bg-white/5 border border-transparent transition-all text-left"
                style={
                  {
                    "--hover-border": `${com.color}30`,
                  } as React.CSSProperties
                }
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{
                    background: `${com.color}15`,
                    border: `1px solid ${com.color}30`,
                  }}
                >
                  {com.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white/80 truncate">{com.name}</h3>
                  <p className="text-xs text-white/40 truncate">{com.lastMessage}</p>
                </div>
                {com.dot && (
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: com.color,
                      boxShadow: `0 0 6px ${com.color}`,
                    }}
                  />
                )}
              </button>
            ))}
          </>
        )}
      </div>
    </aside>
  );

  /* =========================================================
     🔹 Chat Thread
  ========================================================= */

  const ChatThread = (
    <main className="flex-1 flex flex-col relative bg-[#12001F]/30">
      {/* Chat Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-[#12001F]/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Back button (mobile only) */}
          <button
            className="md:hidden p-1.5 rounded-full hover:bg-white/5 transition-colors mr-1"
            onClick={() => setShowMobile("sidebar")}
          >
            <ArrowLeft size={20} className="text-white/60" />
          </button>

          {/* Avatar */}
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
              style={{
                background: `${activeConv.color}20`,
                border: `2px solid ${activeConv.color}40`,
                color: activeConv.color,
              }}
            >
              {activeConv.initials}
            </div>
            <div
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#12001F]"
              style={{ backgroundColor: onlineColor[activeConv.online] }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-base leading-tight">
                {activeConv.name}
              </h2>
              {activeConv.online === "online" && (
                <span className="px-2 py-0.5 rounded-full bg-[#7CFF8A]/10 text-[#7CFF8A] text-[10px] border border-[#7CFF8A]/20">
                  Online
                </span>
              )}
            </div>
            <p className="text-xs text-white/40">{activeConv.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <Phone size={18} />
          </button>
          <button className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <Video size={18} />
          </button>
          <button className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 pb-36">
        {/* Date divider */}
        <div className="flex justify-center">
          <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-white/30 font-medium uppercase tracking-widest border border-white/5">
            Today
          </span>
        </div>

        {activeConv.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[80%] ${
              msg.from === "me"
                ? "self-end ml-auto flex-row-reverse"
                : "self-start"
            }`}
          >
            {/* Other person avatar */}
            {msg.from === "them" && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs self-end mb-1 shrink-0"
                style={{
                  background: `${activeConv.color}20`,
                  border: `1.5px solid ${activeConv.color}40`,
                  color: activeConv.color,
                }}
              >
                {activeConv.initials[0]}
              </div>
            )}

            <div
              className={`flex flex-col gap-1 ${
                msg.from === "me" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`px-4 py-3 text-sm leading-relaxed ${
                  msg.from === "me"
                    ? "rounded-2xl rounded-br-none bg-white/8 border border-white/10 text-white shadow-lg"
                    : "rounded-2xl rounded-bl-none bg-white/5 border border-white/5 text-white/85"
                }`}
              >
                {msg.text}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-white/30">{msg.time}</span>
                {msg.from === "me" &&
                  (msg.read ? (
                    <CheckCheck size={11} className="text-[#7CFF8A]" />
                  ) : (
                    <Check size={11} className="text-white/30" />
                  ))}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#12001F]/95 backdrop-blur-md border-t border-white/5">
        <div className="flex items-end gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 focus-within:border-[#7CFF8A]/40 focus-within:shadow-[0_0_15px_rgba(122,255,136,0.08)] transition-all">
          <button className="p-2 text-white/30 hover:text-[#7CFF8A] transition-colors rounded-full hover:bg-white/5 self-end mb-0.5">
            <PlusCircle size={20} />
          </button>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none resize-none py-2.5 max-h-32"
          />

          <div className="flex items-center gap-1 self-end mb-0.5">
            <button className="p-2 text-white/30 hover:text-white transition-colors rounded-full hover:bg-white/5">
              <Smile size={20} />
            </button>
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className={`p-2 rounded-xl transition-all flex items-center justify-center active:scale-95 ${
                message.trim()
                  ? "bg-gradient-to-r from-[#7CFF8A] to-[#5eff6e] text-[#12001F] hover:shadow-[0_0_15px_rgba(122,255,136,0.5)] hover:scale-105"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        <p className="text-center mt-1.5 text-[10px] text-white/20">
          Press{" "}
          <span className="font-mono text-white/40">Enter</span> to send,{" "}
          <span className="font-mono text-white/40">Shift+Enter</span> for new line
        </p>
      </div>
    </main>
  );

  /* =========================================================
     🔹 Render
  ========================================================= */

  return (
    <div className="fixed inset-0 z-10 flex overflow-hidden">
      {/* Desktop: side-by-side */}
      <div className="hidden md:flex w-[360px] h-full">{Sidebar}</div>
      <div className="hidden md:flex flex-1 h-full flex-col">{ChatThread}</div>

      {/* Mobile: toggle between sidebar and chat */}
      <div className="flex md:hidden w-full h-full">
        {showMobile === "sidebar" ? (
          <div className="w-full h-full">{Sidebar}</div>
        ) : (
          <div className="w-full h-full flex flex-col">{ChatThread}</div>
        )}
      </div>
    </div>
  );
}
