"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Calendar, PlusCircle, X, Search, MessageSquare, LogOut, BellOff, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import Link from "next/link";

export default function CommunityDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { createGroup, conversations, fetchConversations } = useChat();

  const [community, setCommunity] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create group modal state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupParticipants, setGroupParticipants] = useState<any[]>([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantResults, setParticipantResults] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      // 1. Fetch community conversation
      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();
      setCommunity(conv);

      // 2. Check if current user is admin of this community
      const { data: membership } = await supabase
        .from("conversation_participants")
        .select("is_admin")
        .eq("conversation_id", id)
        .eq("profile_id", user.uid)
        .single();
      setIsAdmin(membership?.is_admin || false);

      // 3. Check membership state (for muting)
      const currentMembership = membership;

      // 4. Fetch collab groups under this community
      const { data: communityGroups } = await supabase
        .from("conversations")
        .select("*")
        .eq("community_id", id)
        .is("deleted_at", null)
        .eq("type", "collab");
      setGroups(communityGroups || []);

      // 5. Fetch community members
      const { data: participants } = await supabase
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
      setMembers(participants || []);

    } catch (err) {
      console.error("Error fetching community data:", err);
    } finally {
      setLoading(false);
    }
  };

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const fetchMuteState = async () => {
      if (!id || !user) return;
      const { data } = await supabase
        .from("conversation_participants")
        .select("is_muted")
        .eq("conversation_id", id)
        .eq("profile_id", user.uid)
        .single();
      setIsMuted(data?.is_muted || false);
    };
    fetchMuteState();
  }, [id, user]);

  const handleLeaveCommunity = async () => {
    if (!id || !confirm("Are you sure you want to leave this community?")) return;

    const activeMembers = members.filter(m => !m.left_at);
    const activeAdmins = activeMembers.filter(m => m.is_admin);
    if (isAdmin && activeAdmins.length <= 1 && activeMembers.length > 1) {
      alert("You are the last admin of this community. Please promote someone else before leaving, or delete the community entirely.");
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
      console.error("Error leaving community:", err);
    }
  };

  const handleMuteCommunity = async () => {
    if (!id || !user) return;
    try {
      const newMuteState = !isMuted;
      const { error } = await supabase
        .from("conversation_participants")
        .update({ is_muted: newMuteState })
        .match({ conversation_id: id, profile_id: user?.uid });
      if (error) throw error;
      setIsMuted(newMuteState);
    } catch (err) {
      console.error("Error muting community:", err);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!isAdmin || !id || !confirm("Are you sure you want to delete this community? It will be permanently removed in 72 hours.")) return;
    try {
      await supabase
        .from("conversations")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
        
      // Also soft delete all affiliated collab groups
      await supabase
        .from("conversations")
        .update({ deleted_at: new Date().toISOString() })
        .eq("community_id", id);
      
      await fetchConversations();
      router.push("/dms");
    } catch (err) {
      console.error("Error deleting community:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, user]);

  // Participant search
  useEffect(() => {
    if (!participantSearch.trim() || participantSearch.length < 2) {
      setParticipantResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, handle, display_name, avatar_color")
        .or(`handle.ilike.%${participantSearch}%,display_name.ilike.%${participantSearch}%`)
        .limit(5);
      const filtered = (data || []).filter(u => !groupParticipants.find(p => p.id === u.id) && u.id !== user?.uid);
      setParticipantResults(filtered);
    }, 300);
    return () => clearTimeout(timer);
  }, [participantSearch, groupParticipants]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || groupParticipants.length < 2) return;
    setIsCreating(true);
    try {
      const ids = groupParticipants.map(p => p.id);
      const newId = await createGroup(newGroupName.trim(), ids, `Welcome to ${newGroupName}!`, id as string);
      if (newId) {
        setIsCreateGroupOpen(false);
        setNewGroupName("");
        setGroupParticipants([]);
        fetchData(); // Refresh group list
      }
    } catch (err) {
      console.error("Error creating group:", err);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808]">
        <div className="w-10 h-10 border-4 border-[#7CFF8A]/30 border-t-[#7CFF8A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#080808]">
        <p className="text-white/40">Community not found.</p>
        <button onClick={() => router.back()} className="text-[#7CFF8A] text-sm underline">Go back</button>
      </div>
    );
  }

  const initials = community.name?.charAt(0).toUpperCase() || "C";
  const color = community.avatar_color || "#7CFF8A";

  return (
    <div className="min-h-screen pb-32 bg-[#080808]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-white flex-1 truncate">{community.name}</h1>
      </div>

      <div className="max-w-[800px] mx-auto px-4 mt-8 space-y-6">
        {/* Hero card */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col md:flex-row gap-6 items-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at top left, ${color}20, transparent 60%)` }} />
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-bold shrink-0 relative z-10"
            style={{ background: `${color}20`, border: `3px solid ${color}40`, color, boxShadow: `0 0 30px ${color}30` }}
          >
            {initials}
          </div>
          <div className="flex-1 text-center md:text-left relative z-10">
            <h2 className="text-2xl font-black text-white mb-1">{community.name}</h2>
            <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start text-xs text-white/40 mt-2">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} />
                Created {new Date(community.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare size={13} />
                {groups.length} Group{groups.length !== 1 ? "s" : ""}
              </div>
              {isAdmin && (
                <span className="text-[10px] font-bold text-[#7CFF8A] bg-[#7CFF8A]/10 px-2 py-0.5 rounded uppercase tracking-wider">Admin</span>
              )}
            </div>
          </div>
        </section>

        {/* Groups section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest pl-1">Collab Groups</h3>
            {isAdmin && (
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="bg-[#7CFF8A] text-[#12001F] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:scale-105 transition-all active:scale-95 shadow-[0_0_15px_rgba(124,255,138,0.2)]"
              >
                <PlusCircle size={15} />
                New Group
              </button>
            )}
          </div>
          {groups.length === 0 ? (
            <div className="py-10 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
              <p className="text-white/30 text-sm">No groups yet.</p>
              {isAdmin && (
                <button onClick={() => setIsCreateGroupOpen(true)} className="mt-3 text-xs text-[#7CFF8A] font-semibold hover:underline">
                  + Create the first group
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map(group => (
                <Link
                  key={group.id}
                  href={`/dms?conv=${group.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07] transition-all group"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: `${group.avatar_color}20`, color: group.avatar_color }}
                  >
                    {group.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-[#7CFF8A] transition-colors truncate">{group.name}</p>
                    <p className="text-xs text-white/40 truncate">{group.last_message || "Group Chat"}</p>
                  </div>
                  <div className="text-white/20 group-hover:text-white/40 transition-colors">
                    <MessageSquare size={16} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Members List */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest pl-1">Members</h3>
          <div className="space-y-1">
            {members
              .filter(m => !m.left_at)
              .sort((a, b) => (a.profiles?.handle || "").localeCompare(b.profiles?.handle || ""))
              .map(member => {
                const isYou = member.profile_id === user?.uid;
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
                  </div>
                );
            })}
          </div>
        </section>

        {/* Action Buttons */}
        <section className="pt-8 space-y-3">
          <button 
            onClick={handleMuteCommunity}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/5"
          >
            <BellOff size={18} className={isMuted ? "text-[#7CFF8A]" : ""} />
            <span className="font-bold">{isMuted ? "Unmute Community" : "Mute Community"}</span>
          </button>

          <button 
            onClick={handleLeaveCommunity}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-[#FF5A5A]/10 text-white/70 hover:text-[#FF5A5A] transition-colors border border-white/5"
          >
            <LogOut size={18} />
            <span className="font-bold">Leave Community</span>
          </button>

          {isAdmin && (
            <button 
              onClick={handleDeleteCommunity}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-[#FF5A5A]/10 hover:bg-[#FF5A5A]/20 text-[#FF5A5A] transition-colors border border-[#FF5A5A]/20 mt-8"
            >
              <Trash2 size={18} />
              <span className="font-bold">Delete Community</span>
            </button>
          )}
        </section>
      </div>

      {/* Create Group Modal */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCreateGroupOpen(false)} />
          <div className="relative w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-white">New Group</h2>
                <button onClick={() => setIsCreateGroupOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-white/30">This group will be created under <span className="text-[#7CFF8A]">{community.name}</span></p>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Group Name */}
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Group Name</label>
                <input
                  autoFocus
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="e.g. Design Sprint"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#7CFF8A]/40 transition-colors"
                />
              </div>

              {/* Add Members */}
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Add Members <span className="text-white/20 normal-case">(min 2)</span></label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    value={participantSearch}
                    onChange={e => setParticipantSearch(e.target.value)}
                    placeholder="Search by name or handle..."
                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 pl-9 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#7CFF8A]/40 transition-colors"
                  />
                </div>

                {participantResults.length > 0 && (
                  <div className="mt-2 bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
                    {participantResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setGroupParticipants(prev => [...prev, u]);
                          setParticipantSearch("");
                          setParticipantResults([]);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${u.avatar_color}20`, color: u.avatar_color }}>
                          {u.display_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{u.display_name}</p>
                          <p className="text-xs text-white/40">@{u.handle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected participants */}
                {groupParticipants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {groupParticipants.map(p => (
                      <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7CFF8A]/10 border border-[#7CFF8A]/20 rounded-xl text-xs text-[#7CFF8A]">
                        {p.display_name}
                        <button onClick={() => setGroupParticipants(prev => prev.filter(x => x.id !== p.id))} className="hover:text-white transition-colors">
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5">
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || groupParticipants.length < 2 || isCreating}
                className="w-full py-3 rounded-2xl bg-[#7CFF8A] text-[#12001F] font-bold transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isCreating ? "Creating..." : groupParticipants.length < 2 ? `Add ${2 - groupParticipants.length} more to create` : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
