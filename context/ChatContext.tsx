"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { useUserProfile } from "./UserProfileContext";


export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageAt: string;
  online: "online" | "offline" | "away";
  initials: string;
  color: string;
  subtitle: string;
  handle: string;
  type: "dm" | "collab" | "community";
  communityId: string | null;
  isPinned: boolean;
  isMuted: boolean;
  joinedAt: string;
  leftAt: string | null;
  clearedAt: string | null;
}

interface ChatContextType {
  conversations: Conversation[];
  messages: Message[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (text: string, conversationIdOverride?: string) => Promise<void>;
  startConversation: (targetUserId: string, initialMessage: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  togglePin: (conversationId: string, pinned: boolean) => Promise<void>;
  createGroup: (name: string, participantIds: string[], initialMessage?: string, communityId?: string) => Promise<string | null>;
  createCommunity: (name: string, description?: string) => Promise<string | null>;
  leaveGroup: (conversationId: string) => Promise<void>;
  muteConversation: (conversationId: string, muted: boolean) => Promise<void>;
  clearChat: (conversationId: string) => Promise<void>;
  fetchConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);


  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Fetch conversations where user is a participant
      const { data, error } = await supabase
        .from("conversation_participants")
        .select(`
          conversation_id,
          is_pinned,
          is_muted,
          joined_at,
          left_at,
          cleared_at,
          conversations!inner (
            id,
            name,
            type,
            community_id,
            avatar_color,
            last_message,
            last_message_at
          )
        `)
        .eq("profile_id", user.uid)
        .eq("is_deleted", false)
        .is("conversations.deleted_at", null);

      if (error) throw error;

      // Filter out any items where conversations might be null (though !inner should handle it)
      const validData = (data as any[]).filter(item => item.conversations);

      // For each conversation, fetch the other participant's profile
      const rawConvs = await Promise.all(
        validData.map(async (item: any) => {
          const conv = item.conversations;
          
          if (conv.type === "dm") {
            // Get other participant for DM
            const { data: participants, error: pError } = await supabase
              .from("conversation_participants")
              .select("profile_id, profiles(display_name, handle, avatar_color, dept, year, is_deactivated)")
              .eq("conversation_id", conv.id)
              .neq("profile_id", user.uid);

            const otherParticipant = participants?.[0];
            const otherUser: any = otherParticipant?.profiles;

            if (otherUser?.is_deactivated) return null; // Filter out deactivated DM partner
            
            if (pError) console.error("Error fetching participant profile:", pError);

            return {
              id: conv.id,
              name: otherUser?.display_name || "Unknown User",
              lastMessage: conv.last_message || "",
              lastMessageAt: conv.last_message_at,
              online: "offline",
              initials: (otherUser?.display_name || "U").charAt(0).toUpperCase(),
              color: otherUser?.avatar_color || "#7CFF8A",
              subtitle: otherUser ? `${otherUser.dept} · ${otherUser.year}` : "",
              handle: otherUser?.handle || "",
              type: "dm",
              communityId: null,
              isPinned: item.is_pinned || false,
              isMuted: item.is_muted || false,
              joinedAt: item.joined_at,
              leftAt: item.left_at,
              clearedAt: item.cleared_at,
            } as Conversation;
          } else {
            // For groups/communities, compute effective last message
            let effectiveLastMessage = conv.last_message || "";
            let effectiveLastMessageAt = conv.last_message_at;

            const joinedAt = item.joined_at;
            const leftAt = item.left_at;
            const clearedAt = item.cleared_at;

            // If the user has left or cleared, fetch the correct boundary message
            if (leftAt || clearedAt) {
              let q = supabase
                .from("messages")
                .select("text, created_at")
                .eq("conversation_id", conv.id)
                .gte("created_at", joinedAt)
                .order("created_at", { ascending: false })
                .limit(1);

              if (leftAt) q = q.lte("created_at", leftAt);
              if (clearedAt) q = q.gt("created_at", clearedAt);

              const { data: lastMsgData } = await q;
              if (lastMsgData && lastMsgData.length > 0) {
                effectiveLastMessage = lastMsgData[0].text;
                effectiveLastMessageAt = lastMsgData[0].created_at;
              } else {
                effectiveLastMessage = "";
                effectiveLastMessageAt = conv.last_message_at;
              }
            }

            return {
              id: conv.id,
              name: conv.name || "Unnamed Group",
              lastMessage: effectiveLastMessage,
              lastMessageAt: effectiveLastMessageAt,
              online: "offline",
              initials: (conv.name || "G").charAt(0).toUpperCase(),
              color: conv.avatar_color || "#7CFF8A",
              subtitle: conv.type === "collab" ? "Group Chat" : "Community Channel",
              handle: conv.id,
              type: conv.type as "dm" | "collab" | "community",
              communityId: conv.community_id,
              isPinned: item.is_pinned || false,
              isMuted: item.is_muted || false,
              joinedAt: item.joined_at,
              leftAt: item.left_at,
              clearedAt: item.cleared_at,
            } as Conversation;
          }
        })
      );

       // Sort: Pinned first, then Newest Message
      const sortedConvs = rawConvs
        .filter((c): c is Conversation => c !== null)
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });

      setConversations(sortedConvs);
    } catch (err: any) {
      console.error("Error fetching conversations:", err?.message || err);
      console.error("Full fetch error:", err);
    }
  };

  const fetchMessages = async (convId: string) => {
    if (!user) return;
    try {
      // Get participant constraints for filtering
      const conv = conversations.find(c => c.id === convId);
      if (!conv) return;

      // Fetch all messages for this conversation with constraints
      let query = supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .gte("created_at", conv.joinedAt);
      
      if (conv.leftAt) {
        query = query.lte("created_at", conv.leftAt);
      }
      
      if (conv.clearedAt) {
        query = query.gt("created_at", conv.clearedAt);
      }

      const { data, error } = await query.order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();

      // Subscribe to conversation updates
      const convChannel = supabase
        .channel("public:conversations")
        .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, (payload) => {
          fetchConversations();
        })
        .subscribe();

      // Subscribe to participant updates (for is_deleted and is_pinned)
      const partChannel = supabase
        .channel("public:conversation_participants")
        .on(
          "postgres_changes", 
          { 
            event: "UPDATE", 
            schema: "public", 
            table: "conversation_participants",
            filter: `profile_id=eq.${user.uid}`
          }, 
          (payload) => {
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(convChannel);
        supabase.removeChannel(partChannel);
      };
    }
  }, [user]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);

      // Subscribe to messages in this conversation
      const msgChannel = supabase
        .channel(`msg:${activeConversationId}`)
        .on(
          "postgres_changes",
          { 
            event: "INSERT", 
            schema: "public", 
            table: "messages",
            filter: `conversation_id=eq.${activeConversationId}` 
          },
          (payload) => {
            const newMessage = payload.new as Message;
            
            // IGNORE if the user has left this conversation
            const currentConv = conversations.find(c => c.id === activeConversationId);
            if (currentConv?.leftAt) return;

            setMessages((prev) => {
              const existingIndex = prev.findIndex(m => 
                m.sender_id === newMessage.sender_id && 
                m.text === newMessage.text && 
                Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 10000
              );

              if (existingIndex !== -1) {
                const newMsgs = [...prev];
                newMsgs[existingIndex] = newMessage;
                return newMsgs;
              }
              
              return [...prev, newMessage];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(msgChannel);
      };
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const sendMessage = async (text: string, conversationIdOverride?: string) => {
    const targetConvId = conversationIdOverride || activeConversationId;
    if (!user || !targetConvId) return;
    if (!profile.isVerified) {
      alert("Please verify your email from Settings > Account to send messages.");
      return;
    }


    const tempId = crypto.randomUUID();
    const tempMsg: Message = {
      id: tempId,
      conversation_id: targetConvId,
      sender_id: user.uid,
      text: text,
      created_at: new Date().toISOString(),
    };

    // Optimistic Update
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: targetConvId,
        sender_id: user.uid,
        text: text,
      });

      if (msgError) throw msgError;

      await supabase.from("conversations").update({
        last_message: text,
        last_message_at: new Date().toISOString(),
      }).eq("id", targetConvId);

      // Restore conversation for ACTIVE participants (where left_at is NULL)
      await supabase
        .from("conversation_participants")
        .update({ is_deleted: false })
        .eq("conversation_id", targetConvId)
        .is("left_at", null);

      // Trigger notifications for ALL other ACTIVE participants
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("profile_id")
        .eq("conversation_id", targetConvId)
        .neq("profile_id", user.uid)
        .is("left_at", null);

      if (participants && participants.length > 0) {
        const notifications = participants.map(p => ({
          recipient_id: p.profile_id,
          actor_id: user.uid,
          type: "message",
          entity_id: targetConvId,
          content: text.length > 60 ? text.substring(0, 60) + "..." : text,
        }));

        const { error: notifError } = await supabase.from("notifications").insert(notifications);
        if (notifError) console.error("Error creating message notifications:", notifError);
      }

      // Refresh conversations to show the restored chat or updated last message
      fetchConversations();

    } catch (err) {
      console.error("Error sending message:", err);
      // Rollback
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const startConversation = async (targetUserId: string, initialMessage: string) => {
    if (!user) return;
    if (!profile.isVerified) {
      alert("Please verify your email from Settings > Account to start a conversation.");
      return;
    }


    try {
      // 1. Check if a 1-on-1 conversation already exists between these two users
      const { data: existingConvs, error: checkError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("profile_id", user.uid);

      if (checkError) throw checkError;

      let existingId = null;

      if (existingConvs && existingConvs.length > 0) {
        // Find if any of these conversations also have the target user as the ONLY other participant
        const convIds = existingConvs.map(c => c.conversation_id);
        
        const { data: commonParticipants, error: commonError } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .in("conversation_id", convIds)
          .eq("profile_id", targetUserId);

        if (commonError) throw commonError;

        if (commonParticipants && commonParticipants.length > 0) {
          // Double check that it's a 1-on-1 conversation (has exactly 2 participants)
          for (const cp of commonParticipants) {
            const { count } = await supabase
              .from("conversation_participants")
              .select("*", { count: 'exact', head: true })
              .eq("conversation_id", cp.conversation_id);
            
            if (count === 2) {
              existingId = cp.conversation_id;
              break;
            }
          }
        }
      }

      let activeId = existingId;

      if (!existingId) {
        // 2. Create new conversation if none exists
        const { data: conv, error: convError } = await supabase
          .from("conversations")
          .insert({
            last_message: initialMessage,
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (convError) throw convError;
        activeId = conv.id;

        // 3. Add participants
        await supabase.from("conversation_participants").insert([
          { conversation_id: activeId, profile_id: user.uid },
          { conversation_id: activeId, profile_id: targetUserId },
        ]);
      }

      // 4. Send message to the conversation (existing or new)
      await sendMessage(initialMessage, activeId);

      // 5. Update UI
      setActiveConversationId(activeId);
      
      // 6. Refresh conversations list
      fetchConversations();

    } catch (err: any) {
      console.error("Error starting conversation:", err?.message || err);
      console.error("Full start error:", err);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!user) return;
    try {
      // 1. Mark as deleted for the current user
      const { error: updateError } = await supabase
        .from("conversation_participants")
        .update({ 
          is_deleted: true
        })
        .eq("conversation_id", id)
        .eq("profile_id", user.uid);

      if (updateError) throw updateError;

      // 2. Check if all participants have marked it as deleted
      const { data: participants, error: checkError } = await supabase
        .from("conversation_participants")
        .select("is_deleted")
        .eq("conversation_id", id);

      if (checkError) throw checkError;

      const allDeleted = participants.every(p => p.is_deleted === true);

      if (allDeleted) {
        // 3. Soft delete the conversation for everyone
        const { error: deleteError } = await supabase
          .from("conversations")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", id);
        
        if (deleteError) throw deleteError;
      }

      // 4. Update UI
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
      fetchConversations();

    } catch (err: any) {
      console.error("Error deleting conversation:", err?.message || err);
    }
  };

  const togglePin = async (conversationId: string, pinned: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("conversation_participants")
        .update({ is_pinned: pinned })
        .eq("conversation_id", conversationId)
        .eq("profile_id", user.uid);

      if (error) throw error;
      fetchConversations();
    } catch (err) {
      console.error("Error toggling pin:", err);
    }
  };

  const createGroup = async (name: string, participantIds: string[], initialMessage?: string, communityId?: string) => {
    if (!user) return null;
    if (!profile.isVerified) {
      alert("Please verify your email from Settings > Account to create a group.");
      return null;
    }


    try {
      // 1. Create conversation record
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({
          name,
          type: "collab",
          community_id: communityId || null,
          avatar_color: ["#7CFF8A", "#FF5C8A", "#4DEFFF", "#FFD166", "#A090B0"][Math.floor(Math.random() * 5)],
          last_message: initialMessage || "Group created",
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) throw convError;

      // 2. Add participants (creator is admin, others are not)
      const allParticipants = [...new Set([...participantIds, user.uid])];
      const participantRecords = allParticipants.map(pid => ({
        conversation_id: conv.id,
        profile_id: pid,
        is_admin: pid === user.uid  // creator is admin
      }));

      if (communityId) {
        allParticipants.forEach(pid => {
          participantRecords.push({
            conversation_id: communityId,
            profile_id: pid,
            is_admin: false, // Dont automatically make them admin of community
          });
        });
      }

      const { error: partError } = await supabase
        .from("conversation_participants")
        .upsert(participantRecords, { onConflict: "conversation_id,profile_id" });

      if (partError) throw partError;

      // 3. Send initial message if provided
      if (initialMessage) {
        await sendMessage(initialMessage, conv.id);
      }

      fetchConversations();
      return conv.id;
    } catch (err) {
      console.error("Error creating group:", err);
      return null;
    }
  };

  const createCommunity = async (name: string, description?: string) => {
    if (!user) return null;
    if (!profile.isVerified) {
      alert("Please verify your email from Settings > Account to create a community.");
      return null;
    }


    try {
      // 1. Create the parent community record
      // Using 'conversations' table but with type 'community'
      // Later this could link to a dedicated 'communities' table if needed
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({
          name,
          type: "community",
          avatar_color: ["#4DEFFF", "#A090B0", "#7CFF8A"][Math.floor(Math.random() * 3)],
          last_message: description || "Community created",
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) throw convError;

      // 2. Add the creator as a participant
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert({
          conversation_id: conv.id,
          profile_id: user.uid,
          is_admin: true // Explicitly marking as admin
        });

      if (partError) throw partError;

      fetchConversations();
      return conv.id;
    } catch (err) {
      console.error("Error creating community:", err);
      return null;
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      messages,
      activeConversationId,
      setActiveConversationId,
      sendMessage,
      startConversation,
      deleteConversation,
      togglePin,
      createGroup,
      createCommunity,
      fetchConversations,
      leaveGroup: async (id: string) => {
        if (!user) return;
        try {
          const now = new Date().toISOString();
          const { error } = await supabase
            .from("conversation_participants")
            .update({ left_at: now })
            .match({ conversation_id: id, profile_id: user.uid });
          
          if (error) throw error;

          // Send system message
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.uid)
            .single();
          
          await sendMessage(`${profile?.display_name || "Someone"} has left the collab`, id);
          
          fetchConversations();
        } catch (err) {
          console.error("Error leaving group:", err);
        }
      },
      muteConversation: async (id: string, muted: boolean) => {
        if (!user) return;
        try {
          const { error } = await supabase
            .from("conversation_participants")
            .update({ is_muted: muted })
            .match({ conversation_id: id, profile_id: user.uid });
          
          if (error) throw error;
          fetchConversations();
        } catch (err) {
          console.error("Error muting conversation:", err);
        }
      },
      clearChat: async (id: string) => {
        if (!user) return;
        try {
          const now = new Date().toISOString();
          const { error } = await supabase
            .from("conversation_participants")
            .update({ cleared_at: now })
            .match({ conversation_id: id, profile_id: user.uid });
          
          if (error) throw error;
          
          if (activeConversationId === id) {
            setMessages([]);
          }
          fetchConversations();
        } catch (err) {
          console.error("Error clearing chat:", err);
        }
      }
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
}
