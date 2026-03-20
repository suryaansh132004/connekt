"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Search,
  Edit3,
  PlusCircle,
  Smile,
  Send,
  Code2,
  ArrowLeft,
  Check,
  CheckCheck,
  X,
  MoreVertical,
  Pin,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useChat } from "@/context/ChatContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/layout/Skeleton";

/* =========================================================
   🔹 Types
========================================================= */

type SidebarTab = "Chats" | "Communities" | "Collabs";

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

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾",
  "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "👂", "🦻", "👃", "🧠", "🦷", "👀", "👁️", "👅", "👄",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟",
  "✨", "🌟", "⭐", "💫", "🔥", "💥", "💢", "💦", "💨", "🕳️", "💬", "🗨️", "🗯️", "💭", "💤"
];

/* =========================================================
   🔹 Component
========================================================= */

export default function DMsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { 
    conversations, 
    messages, 
    activeConversationId, 
    setActiveConversationId, 
    sendMessage,
    startConversation,
    deleteConversation,
    leaveGroup,
    muteConversation,
    clearChat
  } = useChat();

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("Chats");
  const [message, setMessage] = useState("");
  const [showMobile, setShowMobile] = useState<"sidebar" | "chat">("sidebar");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState<string | null>(null);
  const sidebarMenuRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [expandedCommunities, setExpandedCommunities] = useState<Record<string, boolean>>({});

  const { togglePin } = useChat();

  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [newMessageTo, setNewMessageTo] = useState("");
  const [newMessageText, setNewMessageText] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isCreateCommunityModalOpen, setIsCreateCommunityModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDesc, setNewCommunityDesc] = useState("");
  const [selectedCommunityForGroup, setSelectedCommunityForGroup] = useState<string | null>(null);
  const [groupParticipants, setGroupParticipants] = useState<any[]>([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantSearchResults, setParticipantSearchResults] = useState<any[]>([]);
  const [adminCommunities, setAdminCommunities] = useState<{id: string; name: string}[]>([]);

  const { createGroup, createCommunity } = useChat();

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  // Fetch communities where the user is admin
  useEffect(() => {
    const fetchAdminCommunities = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("conversation_participants")
        .select("conversation_id, conversations!inner(id, name, type)")
        .eq("profile_id", user.uid)
        .eq("is_admin", true)
        .eq("conversations.type", "community");
      
      const communities = (data || []).map((d: any) => ({
        id: d.conversations.id,
        name: d.conversations.name
      }));
      setAdminCommunities(communities);
    };
    fetchAdminCommunities();
  }, [user]);

  useEffect(() => {
    if (conversations.length > 0) {
      setIsLoading(false);
    } else {
      const timer = setTimeout(() => setIsLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [conversations]);

  /* ----------------------------
     🔸 User Autocomplete
  ----------------------------- */

  useEffect(() => {
    const searchUsers = async () => {
      const term = newMessageTo.trim().replace(/^@/, "");
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, handle, display_name, avatar_color")
          .or(`handle.ilike.%${term}%,display_name.ilike.%${term}%`)
          .neq("id", user?.uid) // Don't show current user
          .limit(5);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [newMessageTo, user?.uid]);

  /* ----------------------------
     Detailed Participant Search
  ----------------------------- */
  useEffect(() => {
    const searchParticipants = async () => {
      const term = participantSearch.trim().replace(/^@/, "");
      if (term.length < 2) {
        setParticipantSearchResults([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, handle, display_name, avatar_color")
          .or(`handle.ilike.%${term}%,display_name.ilike.%${term}%`)
          .neq("id", user?.uid)
          .limit(5);

        if (error) throw error;
        setParticipantSearchResults(data || []);
      } catch (err) {
        console.error("Participant search error:", err);
      }
    };

    const timer = setTimeout(searchParticipants, 300);
    return () => clearTimeout(timer);
  }, [participantSearch, user?.uid]);

  // Close sidebar menu and emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(event.target as Node)) {
        setSidebarMenuOpen(null);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Chat Refs */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper for formatting time
  const formatTime = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /* ----------------------------
     🔸 Scroll to bottom
  ----------------------------- */

  useEffect(() => {
    const parent = messagesEndRef.current?.parentElement;
    if (parent) parent.scrollTop = parent.scrollHeight;
  }, [activeConversationId, messages.length]);

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
     🔸 Handlers
  ----------------------------- */

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessage(message.trim());
    setMessage("");
    setShowEmojiPicker(false);
  };

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    // Focus back on textarea after adding emoji
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectConv = (id: string) => {
    if (activeConversationId === id) return;
    setIsLoadingChat(true);
    setActiveConversationId(id);
    setShowMobile("chat");
    setTimeout(() => setIsLoadingChat(false), 300);
  };

  const handleNewMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageTo.trim() || !newMessageText.trim()) return;

    const cleanHandle = newMessageTo.trim().replace(/^@/, '');
    
    try {
      const { data: targetProfile, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle", cleanHandle)
        .single();

      if (targetProfile) {
        await startConversation(targetProfile.id, newMessageText.trim());
        setIsNewMessageModalOpen(false);
        setNewMessageTo("");
        setNewMessageText("");
        setShowMobile("chat");
      } else {
        alert("User not found!");
      }
    } catch (err) {
      console.error("Search error:", err);
      alert("Error finding user. Please check the handle.");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || groupParticipants.length < 2) return;

    try {
      const participantIds = groupParticipants.map(p => p.id);
      const newId = await createGroup(
        newGroupName.trim(), 
        participantIds, 
        `Hey everyone! Let's collab.`,
        selectedCommunityForGroup || undefined
      );
      
      if (newId) {
        setIsCreateGroupModalOpen(false);
        setNewGroupName("");
        setGroupParticipants([]);
        setSelectedCommunityForGroup(null);
        setActiveConversationId(newId);
        setShowMobile("chat");
      }
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName.trim()) return;

    try {
      const newId = await createCommunity(newCommunityName.trim(), newCommunityDesc.trim());
      if (newId) {
        setIsCreateCommunityModalOpen(false);
        setNewCommunityName("");
        setNewCommunityDesc("");
        setActiveConversationId(newId);
        setShowMobile("chat");
      }
    } catch (err) {
      console.error("Error creating community:", err);
    }
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
          <button 
            onClick={() => setIsNewMessageModalOpen(true)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            title="New Direct Message"
          >
            <Edit3 size={17} className="text-white/60" />
          </button>
          
          {(sidebarTab === "Collabs" || sidebarTab === "Communities") && (
            <button 
              onClick={() => sidebarTab === "Collabs" ? setIsCreateGroupModalOpen(true) : setIsCreateCommunityModalOpen(true)}
              className="w-9 h-9 rounded-full bg-[#7CFF8A]/10 hover:bg-[#7CFF8A]/20 flex items-center justify-center transition-colors border border-[#7CFF8A]/20 ml-2"
              title={`Create New ${sidebarTab.slice(0, -1)}`}
            >
              <PlusCircle size={17} className="text-[#7CFF8A]" />
            </button>
          )}
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
        {isLoading ? (
          <div className="space-y-2 mt-2 fade-in">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full p-2 flex gap-3 items-center">
                <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2.5 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {sidebarTab === "Communities" ? (
              conversations
                .filter(c => c.type === "community")
                .map(com => {
                  const subGroups = conversations.filter(c => c.type === "collab" && c.communityId === com.id);
                  const active = com.id === activeConversationId;
                  
                  return (
                    <div key={com.id} className="space-y-1 mb-4">
                        <div
                          onClick={() => setExpandedCommunities(prev => ({ ...prev, [com.id]: !prev[com.id] }))}
                          className={`w-full p-3 rounded-xl flex gap-3 items-center relative transition-all text-left cursor-pointer ${
                            expandedCommunities[com.id] || active ? "bg-white/8 border border-white/10" : "hover:bg-white/5 border border-transparent"
                          }`}
                        >
                           <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm bg-white/5 border border-white/10 text-[#7CFF8A]">
                            {com.initials}
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <h3 className={`text-sm font-bold truncate ${expandedCommunities[com.id] || active ? "text-white" : "text-white/80"}`}>{com.name}</h3>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider">{subGroups.length} Group{subGroups.length !== 1 && 's'}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              selectConv(com.id);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors text-xs font-semibold"
                            title="Open Details"
                          >
                           View 
                          </button>
                        </div>

                        {/* Nested Groups (Accordion) */}
                        <div 
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedCommunities[com.id] ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
                        >
                          {subGroups.length === 0 ? (
                            <div className="ml-4 p-3 text-xs text-white/30 italic">No groups in this community yet.</div>
                          ) : (
                            <div className="space-y-1">
                              {subGroups.map(group => {
                                const gActive = group.id === activeConversationId;
                                return (
                                  <div
                                    key={group.id}
                                    onClick={() => selectConv(group.id)}
                                    className={`w-full ml-4 p-2.5 pr-3 rounded-xl flex gap-3 items-center relative transition-all text-left cursor-pointer border border-transparent ${
                                      gActive ? "bg-[#7CFF8A]/10 border-[#7CFF8A]/20" : "hover:bg-white/5"
                                    }`}
                                  >
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: `${group.color}20`, color: group.color }}>
                                      {group.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className={`text-xs font-medium truncate ${gActive ? "text-white" : "text-white/60"}`}>{group.name}</h4>
                                      <p className="text-[10px] truncate text-white/30">{group.lastMessage}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                })
            ) : (
              conversations
                .filter(conv => {
                  if (sidebarTab === "Chats") return conv.type === "dm";
                  // Exclude community-affiliated collabs from the standalone Collabs tab
                  if (sidebarTab === "Collabs") return conv.type === "collab" && !conv.communityId;
                  return false;
                })
                .map((conv) => {
                  const active = conv.id === activeConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => selectConv(conv.id)}
                      className={`w-full p-3 rounded-xl flex gap-3 items-center relative transition-all text-left cursor-pointer group ${
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
                      </div>

                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3
                              className={`text-sm font-semibold truncate ${
                                active ? "text-white" : "text-white/80"
                              }`}
                            >
                              {conv.name}
                            </h3>
                            {conv.isPinned && (
                              <Pin size={10} className="text-[#7CFF8A] rotate-45 shrink-0" />
                            )}
                            {conv.isMuted && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" title="Muted" />
                            )}
                          </div>
                          <span className="text-[10px] shrink-0 ml-2 text-white/30">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-xs truncate text-white/40">
                          {conv.lastMessage}
                        </p>
                      </div>

                      {/* Sidebar Menu Button */}
                      <div className="relative" ref={sidebarMenuOpen === conv.id ? sidebarMenuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSidebarMenuOpen(sidebarMenuOpen === conv.id ? null : conv.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            sidebarMenuOpen === conv.id ? "bg-white/10 text-white" : "text-white/20 hover:text-white/60"
                          }`}
                        >
                          <MoreVertical size={14} />
                        </button>

                        {sidebarMenuOpen === conv.id && (
                          <div 
                            className="absolute right-0 top-full mt-1 w-32 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl py-1 z-[60] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={async () => {
                                await togglePin(conv.id, !conv.isPinned);
                                setSidebarMenuOpen(null);
                              }}
                              className="w-full px-3 py-2 text-xs text-white/70 hover:bg-white/5 flex items-center gap-2 transition-colors"
                            >
                              <Pin size={12} className={conv.isPinned ? "fill-[#7CFF8A] text-[#7CFF8A]" : ""} />
                              {conv.isPinned ? "Unpin" : "Pin Chat"}
                            </button>
                            {conv.type !== "collab" && conv.type !== "community" && (
                              <button
                                onClick={async () => {
                                  if (confirm("Delete this chat?")) {
                                    await deleteConversation(conv.id);
                                  }
                                  setSidebarMenuOpen(null);
                                }}
                                className="w-full px-3 py-2 text-xs text-[#FF5A5A]/80 hover:bg-[#FF5A5A]/10 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            )}
                            
                            {conv.type === "collab" && (
                              <>
                                <div className="h-[1px] bg-white/5 my-1" />
                                <button
                                  onClick={async () => {
                                    await muteConversation(conv.id, !conv.isMuted);
                                    setSidebarMenuOpen(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs text-white/70 hover:bg-white/5 flex items-center gap-2 transition-colors"
                                >
                                  <div className={`w-3 h-3 rounded-full border border-white/30 flex items-center justify-center`}>
                                    {conv.isMuted && <div className="w-1.5 h-1.5 rounded-full bg-[#7CFF8A]" />}
                                  </div>
                                  {conv.isMuted ? "Unmute" : "Mute"}
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("Clear all messages for you?")) {
                                      await clearChat(conv.id);
                                    }
                                    setSidebarMenuOpen(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs text-white/70 hover:bg-white/5 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 size={12} className="text-white/40" />
                                  Clear Chat
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}

            {conversations.filter(c => {
               if (sidebarTab === "Chats") return c.type === "dm";
               if (sidebarTab === "Collabs") return c.type === "collab";
               if (sidebarTab === "Communities") return c.type === "community";
               return false;
            }).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <MessageCircle size={20} className="text-white/20" />
                </div>
                <p className="text-sm text-white/40 font-medium">No {sidebarTab.toLowerCase()} yet</p>
                <p className="text-xs text-white/20 mt-1">
                  {sidebarTab === "Chats" 
                    ? "Start a direct message to see it here" 
                    : `Create your first ${sidebarTab.slice(0, -1).toLowerCase()} now!`}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );

  /* =========================================================
     🔹 Chat Thread
  ========================================================= */

  const ChatThread = activeConv ? (
    <main className="flex-1 min-h-0 flex flex-col relative">
      {/* Chat Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1.5 rounded-full hover:bg-white/5 transition-colors mr-1"
            onClick={() => setShowMobile("sidebar")}
          >
            <ArrowLeft size={20} className="text-white/60" />
          </button>

          {activeConv.type === "dm" ? (
            <Link 
              href={`/profile/${activeConv.handle}`}
              className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
            >
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-transform"
                  style={{
                    background: `${activeConv.color}20`,
                    border: `2px solid ${activeConv.color}40`,
                    color: activeConv.color,
                  }}
                >
                  {activeConv.initials}
                </div>
              </div>

              <div className="flex flex-col">
                <h2 className="font-bold text-white text-base leading-tight">
                  {activeConv.name}
                </h2>
                <p className="text-xs text-white/40">{activeConv.subtitle}</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
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
              </div>

              <Link 
                href={activeConv.type === "community" ? `/community/${activeConv.id}` : `/collab/${activeConv.id}`}
                className="flex flex-col group hover:opacity-80 transition-opacity"
              >
                <h2 className="font-bold text-white text-base leading-tight group-hover:text-[#7CFF8A] transition-colors">
                  {activeConv.name}
                </h2>
                <p className="text-xs text-white/40">{activeConv.subtitle}</p>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 pb-36">
        {isLoadingChat ? (
          <div className="space-y-6 mt-4 w-full">
            <Skeleton className="h-10 w-2/3 rounded-2xl ml-auto" />
            <Skeleton className="h-16 w-2/3 rounded-2xl" />
          </div>
        ) : (
          messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[80%] ${
                msg.sender_id === user?.uid
                  ? "self-end ml-auto flex-row-reverse"
                  : "self-start"
              }`}
            >
              <div
                className={`flex flex-col gap-1 ${
                  msg.sender_id === user?.uid ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`px-4 py-3 text-sm leading-relaxed ${
                    msg.sender_id === user?.uid
                      ? "rounded-2xl rounded-br-none bg-white/8 border border-white/10 text-white shadow-lg"
                      : "rounded-2xl rounded-bl-none bg-white/5 border border-white/5 text-white/85"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-white/30">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-md border-t border-white/5">
        {activeConv.leftAt ? (
          <div className="flex flex-col items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-white/5 bg-white/3 opacity-60 select-none">
            <p className="text-xs text-white/40 font-medium tracking-wide">
              You've left this group · Inactive members cannot send messages
            </p>
          </div>
        ) : (
        <div className="flex items-end gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 focus-within:border-[#7CFF8A]/40 transition-all">
          {/* Removed PlusCircle as requested */}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none resize-none py-2.5 max-h-32"
          />

          <div 
            className="flex items-center gap-1 self-end mb-0.5 relative" 
            ref={emojiPickerRef}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-4 w-72 h-80 bg-[#1A1A1A]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[100] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                <div className="p-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-white/60 tracking-wider uppercase">Emojis</span>
                  <button 
                    onMouseDown={() => setShowEmojiPicker(false)}
                    className="p-1 hover:bg-white/5 rounded-full transition-colors text-white/30 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
                  <div className="grid grid-cols-7 gap-1">
                    {EMOJIS.map((emoji, idx) => (
                      <button
                        key={idx}
                        onMouseDown={() => addEmoji(emoji)}
                        className="w-9 h-9 flex items-center justify-center text-xl hover:bg-white/10 rounded-lg transition-all hover:scale-125 active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className={`p-2 transition-colors rounded-full hover:bg-white/5 ${showEmojiPicker ? 'text-[#7CFF8A] bg-white/5' : 'text-white/30 hover:text-white'}`}
            >
              <Smile size={20} />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className={`p-2 rounded-xl transition-all flex items-center justify-center active:scale-95 ${
                message.trim()
                  ? "bg-gradient-to-r from-[#7CFF8A] to-[#5eff6e] text-[#12001F] hover:scale-105"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        )}
      </div>
    </main>
  ) : (
    <main className="flex-1 flex flex-col items-center justify-center text-white/40">
      <div className="w-20 h-20 mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
        <MessageCircle size={32} className="text-[#7CFF8A]/70" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Your Messages</h2>
      <p className="text-sm">Select a chat to start messaging.</p>
    </main>
  );

  /* =========================================================
     🔹 New Message Modal
  ========================================================= */

  const NewMessageModal = isNewMessageModalOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#12001F]/90 border border-white/10 rounded-3xl p-6 shadow-2xl relative backdrop-blur-md">
        <button 
          onClick={() => setIsNewMessageModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-6">New Message</h2>
        <form onSubmit={handleNewMessageSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#A090B0] mb-2 ml-1">To Handle:</label>
            <div className="relative">
              <input 
                autoFocus
                value={newMessageTo}
                onChange={(e) => setNewMessageTo(e.target.value)}
                placeholder="@username"
                className="w-full bg-[#1A0B2E] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#7CFF8A]/50 transition-all"
              />
              
              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A0B2E] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                  {searchResults.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => {
                        setNewMessageTo(`@${res.handle}`);
                        setSearchResults([]);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group"
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ 
                          backgroundColor: `${res.avatar_color || '#7CFF8A'}20`,
                          border: `1px solid ${res.avatar_color || '#7CFF8A'}40`,
                          color: res.avatar_color || '#7CFF8A'
                        }}
                      >
                        {res.display_name?.charAt(0) || res.handle?.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-white group-hover:text-[#7CFF8A] transition-colors">{res.display_name}</span>
                        <span className="text-xs text-white/40">@{res.handle}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <div className="w-4 h-4 border-2 border-[#7CFF8A]/30 border-t-[#7CFF8A] rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#A090B0] mb-2 ml-1">Message:</label>
            <textarea 
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full bg-[#1A0B2E] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#7CFF8A]/50 transition-all resize-none"
            />
          </div>
          <button 
            type="submit"
            disabled={!newMessageTo.trim() || !newMessageText.trim()}
            className="w-full mt-4 py-3.5 rounded-xl bg-[#7CFF8A] text-[#12001F] font-bold text-base flex justify-center items-center gap-2 transition-all disabled:opacity-50"
          >
            Send Message <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );

  const CreateGroupModal = isCreateGroupModalOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#12001F]/95 border border-white/10 rounded-3xl p-6 shadow-2xl relative backdrop-blur-md">
        <button onClick={() => setIsCreateGroupModalOpen(false)} className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Create New Group</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#A090B0] mb-2 ml-1">Group Name</label>
            <input 
              value={newGroupName} 
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Project Builders"
              className="w-full bg-[#1A0B2E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7CFF8A]/50 transition-all"
            />
          </div>

          {adminCommunities.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#A090B0] mb-2 ml-1">
                Belongs to Community <span className="text-white/30 normal-case">(Admin only)</span>
              </label>
              <select 
                value={selectedCommunityForGroup || ""} 
                onChange={(e) => setSelectedCommunityForGroup(e.target.value || null)}
                className="w-full bg-[#1A0B2E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7CFF8A]/50 transition-all appearance-none cursor-pointer"
              >
                <option value="">No Community</option>
                {adminCommunities.map(com => (
                  <option key={com.id} value={com.id}>{com.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#A090B0] mb-2 ml-1">Add Members <span className="text-white/30 normal-case">(minimum 2)</span></label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input 
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                placeholder="Search by name or handle..."
                className="w-full bg-[#1A0B2E] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#7CFF8A]/50 transition-all"
              />
              {participantSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A0B2E] border border-white/10 rounded-xl overflow-hidden z-[110] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                  {participantSearchResults.map(res => (
                    <button
                      key={res.id}
                      onClick={() => {
                        if (!groupParticipants.find(p => p.id === res.id)) {
                          setGroupParticipants([...groupParticipants, res]);
                        }
                        setParticipantSearch("");
                        setParticipantSearchResults([]);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" 
                        style={{ backgroundColor: `${res.avatar_color}20`, border: `1px solid ${res.avatar_color}40`, color: res.avatar_color }}
                      >
                        {res.display_name?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{res.display_name}</span>
                        <span className="text-[10px] text-white/40">@{res.handle}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {groupParticipants.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {groupParticipants.map(p => (
                <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7CFF8A]/10 border border-[#7CFF8A]/20 rounded-xl text-xs text-[#7CFF8A]">
                  {p.display_name}
                  <button onClick={() => setGroupParticipants(groupParticipants.filter(x => x.id !== p.id))} className="hover:text-white transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={handleCreateGroup}
            disabled={!newGroupName.trim() || groupParticipants.length < 2}
            className="w-full mt-4 py-3.5 rounded-xl bg-[#7CFF8A] text-[#12001F] font-bold text-base transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            {groupParticipants.length < 2 
              ? `Add ${2 - groupParticipants.length} more member${2 - groupParticipants.length === 1 ? '' : 's'} to create`
              : 'Create Group'
            }
          </button>
        </div>
      </div>
    </div>
  );

  const CreateCommunityModal = isCreateCommunityModalOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#12001F]/95 border border-white/10 rounded-3xl p-6 shadow-2xl relative backdrop-blur-md">
        <button onClick={() => setIsCreateCommunityModalOpen(false)} className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#7CFF8A]/10 border border-[#7CFF8A]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PlusCircle size={32} className="text-[#7CFF8A]" />
          </div>
          <h2 className="text-2xl font-bold text-white">Start a Community</h2>
          <p className="text-white/40 text-sm mt-1">Bring your group chats together.</p>
        </div>

        <form onSubmit={handleCreateCommunity} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#A090B0] mb-2 ml-1">Community Name</label>
            <input 
              value={newCommunityName} 
              onChange={(e) => setNewCommunityName(e.target.value)}
              placeholder="e.g. Design Hub"
              className="w-full bg-[#1A0B2E] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#7CFF8A]/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#A090B0] mb-2 ml-1">Description (Optional)</label>
            <textarea 
              value={newCommunityDesc} 
              onChange={(e) => setNewCommunityDesc(e.target.value)}
              placeholder="A space for design enthusiasts..."
              rows={3}
              className="w-full bg-[#1A0B2E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7CFF8A]/50 transition-all resize-none"
            />
          </div>

          <button 
            type="submit"
            disabled={!newCommunityName.trim()}
            className="w-full mt-4 py-4 rounded-xl bg-[#7CFF8A] text-[#12001F] font-bold text-base transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Community
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-10 flex overflow-hidden">
      <div className="hidden md:flex w-[360px] h-full">{Sidebar}</div>
      <div className="hidden md:flex flex-1 h-full flex-col min-h-0">{ChatThread}</div>
      <div className="flex md:hidden w-full h-full">
        {showMobile === "sidebar" ? Sidebar : ChatThread}
      </div>
      {NewMessageModal}
      {CreateGroupModal}
      {CreateCommunityModal}
    </div>
  );
}
