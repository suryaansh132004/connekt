"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Users, Calendar, UserPlus, X, Search, Crown, LogOut, BellOff, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { Skeleton } from "@/components/layout/Skeleton";
import Link from "next/link";

export default function GroupDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { fetchConversations } = useChat();
  
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!id || !user) return;
      setLoading(true);
      try {
        // 1. Fetch group details
        const { data: conv, error: convError } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", id)
          .is("deleted_at", null)
          .single();

        if (convError) throw convError;
        setGroup(conv);

        // 2. Fetch members
        const { data: participants, error: pError } = await supabase
          .from("conversation_participants")
          .select(`
            profile_id,
            joined_at,
            left_at,
            is_admin,
            is_muted,
            profiles (
              id,
              display_name,
              handle,
              avatar_color,
              dept,
              year,
              is_deactivated
            )
          `)
          .eq("conversation_id", id);

        if (pError) throw pError;
        
        // Filter out members who have left or are deactivated
        const filteredParticipants = (participants || []).filter((p: any) => !p.profiles?.is_deactivated);
        setMembers(filteredParticipants);
        // Check if current user is admin
        const currentMember = (participants || []).find((p: any) => p.profile_id === user?.uid);
        setIsCurrentUserAdmin(currentMember?.is_admin || false);

      } catch (err) {
        console.error("Error fetching group data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [id, user]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, handle, display_name, avatar_color")
          .eq("is_deactivated", false)
          .or(`handle.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
          .limit(5);

        if (error) throw error;
        
        // Filter out people currently active in the group
        const filtered = (data || []).filter(u => !members.some(m => m.profile_id === u.id && !m.left_at));
        setSearchResults(filtered);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, members]);

  const addMember = async (targetUserId: string) => {
    try {
      const recordsToUpsert: any[] = [{
        conversation_id: id,
        profile_id: targetUserId,
        joined_at: new Date().toISOString(),
        left_at: null
      }];

      if (group?.community_id) {
        recordsToUpsert.push({
          conversation_id: group.community_id,
          profile_id: targetUserId,
          joined_at: new Date().toISOString(),
          left_at: null
        });
      }

      const { error } = await supabase
        .from("conversation_participants")
        .upsert(recordsToUpsert, { onConflict: "conversation_id,profile_id" });

      if (error) throw error;

      // Refresh members
      const { data: newParticipants } = await supabase
        .from("conversation_participants")
        .select(`
          profile_id,
          joined_at,
          left_at,
          is_admin,
          is_muted,
          profiles ( id, display_name, handle, avatar_color, dept, year )
        `)
        .eq("conversation_id", id);
      
      setMembers(newParticipants || []);
      setSearchTerm("");
      setSearchResults([]);
    } catch (err) {
      console.error("Error adding member:", err);
    }
  };

  const removeMember = async (targetUserId: string) => {
    if (!isCurrentUserAdmin) return;
    try {
      const { error } = await supabase
        .from("conversation_participants")
        .delete()
        .match({ conversation_id: id, profile_id: targetUserId });

      if (error) throw error;

      // Refresh members list
      const { data: newParticipants } = await supabase
        .from("conversation_participants")
        .select(`profile_id, joined_at, left_at, is_admin, is_muted, profiles ( id, display_name, handle, avatar_color, dept, year )`)
        .eq("conversation_id", id);

      setMembers(newParticipants || []);
      const currentMember = (newParticipants || []).find((p: any) => p.profile_id === user?.uid);
      setIsCurrentUserAdmin(currentMember?.is_admin || false);
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const makeAdmin = async (targetUserId: string) => {
    if (!isCurrentUserAdmin) return;
    try {
      const { error } = await supabase
        .from("conversation_participants")
        .update({ is_admin: true })
        .match({ conversation_id: id, profile_id: targetUserId });

      if (error) throw error;
      
      setMembers(prev => prev.map(m => 
        m.profile_id === targetUserId ? { ...m, is_admin: true } : m
      ));
    } catch (err) {
      console.error("Error making admin:", err);
    }
  };

  const handleLeaveGroup = async () => {
    if (!id || !confirm("Are you sure you want to leave this group?")) return;

    const activeAdmins = activeMembers.filter(m => m.is_admin);
    if (isCurrentUserAdmin && activeAdmins.length <= 1 && activeMembers.length > 1) {
      alert("You are the last admin of this group. Please promote someone else before leaving, or delete the group entirely.");
      return;
    }

    try {
      const { error } = await supabase
        .from("conversation_participants")
        .update({ left_at: new Date().toISOString() })
        .match({ conversation_id: id, profile_id: user?.uid });
      if (error) throw error;
      
      await fetchConversations();
      router.push("/dms");
    } catch (err) {
      console.error("Error leaving group:", err);
    }
  };

  const handleMuteGroup = async () => {
    const currentMember = members.find(m => m.profile_id === user?.uid);
    if (!id || !currentMember) return;
    try {
      const newMuteState = !currentMember.is_muted;
      const { error } = await supabase
        .from("conversation_participants")
        .update({ is_muted: newMuteState })
        .match({ conversation_id: id, profile_id: user?.uid });
      if (error) throw error;
      setMembers(prev => prev.map(m => 
        m.profile_id === user?.uid ? { ...m, is_muted: newMuteState } : m
      ));
    } catch (err) {
      console.error("Error muting group:", err);
    }
  };

  const handleDeleteGroup = async () => {
    if (!isCurrentUserAdmin || !id || !confirm("Are you sure you want to delete this group? It will be permanently removed in 72 hours.")) return;
    try {
      await supabase
        .from("conversations")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      
      await fetchConversations();
      router.push("/dms");
    } catch (err) {
      console.error("Error deleting group:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center gap-4 bg-[#080808]">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  if (!group) return <div className="p-10 text-white">Group not found</div>;

  const activeMembers = members
    .filter(m => !m.left_at)
    .sort((a, b) => (a.profiles?.handle || "").localeCompare(b.profiles?.handle || ""));

  const currentMember = members.find(m => m.profile_id === user?.uid);
  const isMuted = currentMember?.is_muted || false;

  return (
    <div className="min-h-screen pb-32 bg-[#080808]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-white truncate flex-1">{group.name}</h1>
      </div>

      <div className="max-w-[800px] mx-auto px-4 mt-8 space-y-6">
        {/* Info Card */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col md:flex-row gap-6 items-center">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shrink-0"
            style={{ 
              background: `${group.avatar_color}20`, 
              border: `4px solid ${group.avatar_color}40`,
              color: group.avatar_color,
              boxShadow: `0 0 30px ${group.avatar_color}30`
            }}
          >
            {group.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-white mb-2">{group.name}</h2>
            <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start text-xs text-white/40">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                Joined {new Date(group.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={14} />
                {activeMembers.length} Members
              </div>
            </div>
            {group.last_message && group.type === "community" && (
               <p className="mt-4 text-sm text-white/60 italic border-l-2 border-[#7CFF8A]/30 pl-4 py-1">
                 {group.last_message}
               </p>
            )}
          </div>
        </section>

        {/* Member List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest pl-1">Members</h3>
            {isCurrentUserAdmin && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#7CFF8A] text-[#12001F] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:scale-105 transition-all active:scale-95 shadow-[0_0_15px_rgba(124,255,138,0.2)]"
              >
                <UserPlus size={16} />
                <span>Add People</span>
              </button>
            )}
          </div>
          
          <div className="space-y-1">
            {activeMembers.map(member => {
              const isYou = member.profile_id === user?.uid;
              const canRemove = isCurrentUserAdmin && !isYou && !member.is_admin;
              return (
                <div key={member.profile_id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                  <Link href={`/profile/${member.profiles.handle}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <div 
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: `${member.profiles.avatar_color}20`, color: member.profiles.avatar_color }}
                    >
                      {member.profiles.display_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-[#7CFF8A] transition-colors truncate">
                          @{member.profiles.handle}
                        </span>
                        {member.is_admin && (
                          <span className="text-[10px] font-bold text-[#7CFF8A] bg-[#7CFF8A]/10 px-1.5 py-0.5 rounded uppercase shrink-0">Admin</span>
                        )}
                        {isYou && (
                          <span className="text-[10px] font-bold text-white/30 shrink-0">(You)</span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 truncate">{member.profiles.display_name} · {member.profiles.dept}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isCurrentUserAdmin && !isYou && !member.is_admin && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm(`Make @${member.profiles.handle} an admin?`)) makeAdmin(member.profile_id);
                        }}
                        className="p-2 rounded-xl text-[#FFD166]/40 hover:text-[#FFD166] hover:bg-[#FFD166]/10 transition-all"
                        title="Make Admin"
                      >
                        <Crown size={16} />
                      </button>
                    )}
                    {canRemove && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm(`Remove @${member.profiles.handle} from this group?`)) {
                            removeMember(member.profile_id);
                          }
                        }}
                        className="p-2 rounded-xl text-[#FF5A5A]/40 hover:text-[#FF5A5A] hover:bg-[#FF5A5A]/10 transition-all"
                        title="Remove member"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Action Buttons */}
        <section className="pt-8 space-y-3">
          <button 
            onClick={handleMuteGroup}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/5"
          >
            <BellOff size={18} className={isMuted ? "text-[#7CFF8A]" : ""} />
            <span className="font-bold">{isMuted ? "Unmute Group" : "Mute Group"}</span>
          </button>

          <button 
            onClick={handleLeaveGroup}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-[#FF5A5A]/10 text-white/70 hover:text-[#FF5A5A] transition-colors border border-white/5"
          >
            <LogOut size={18} />
            <span className="font-bold">Leave Group</span>
          </button>

          {isCurrentUserAdmin && (
            <button 
              onClick={handleDeleteGroup}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-[#FF5A5A]/10 hover:bg-[#FF5A5A]/20 text-[#FF5A5A] transition-colors border border-[#FF5A5A]/20 mt-8"
            >
              <Trash2 size={18} />
              <span className="font-bold">Delete Group</span>
            </button>
          )}
        </section>
      </div>

      {/* Add People Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Add People</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  autoFocus
                  placeholder="Search by name or @handle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#7CFF8A]/40 transition-colors"
                />
              </div>
            </div>

            <div className="p-2 max-h-[300px] overflow-y-auto">
              {isSearching ? (
                <div className="p-4 flex justify-center"><div className="w-6 h-6 border-2 border-[#7CFF8A] border-t-transparent rounded-full animate-spin" /></div>
              ) : searchResults.length > 0 ? (
                searchResults.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => addMember(u.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: `${u.avatar_color}20`, color: u.avatar_color }}>
                      {u.display_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{u.display_name}</p>
                      <p className="text-xs text-white/40">@{u.handle}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#7CFF8A]/10 flex items-center justify-center text-[#7CFF8A]">
                      <UserPlus size={16} />
                    </div>
                  </button>
                ))
              ) : searchTerm.length > 2 ? (
                <div className="p-8 text-center text-white/30 text-sm italic">No people found</div>
              ) : (
                <div className="p-8 text-center text-white/20 text-xs italic uppercase tracking-widest">Search for people to add</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
