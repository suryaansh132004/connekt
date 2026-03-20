"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { typeColors } from "@/components/feed/PostCard";
import { Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function PublicProfilePage() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract the handle from the pathname (e.g. /profile/admin -> admin)
  const idRaw = pathname.split("/").pop() || "";
  const decodedHandle = decodeURIComponent(idRaw).replace(/^@/, "");

  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!decodedHandle) return;
      setLoading(true);
      try {
        // 1. Fetch Profile by handle
        const { data: profile, error: pError } = await supabase
          .from("profiles")
          .select("*")
          .eq("handle", decodedHandle)
          .single();

        if (pError) throw pError;
        
        if (profile) {
          const formattedProfile = {
            id: profile.id,
            displayName: profile.display_name,
            handle: profile.handle,
            dept: profile.dept || "Unknown Dept",
            year: profile.year || "Student",
            skills: profile.skills || [],
            bio: profile.bio || "No bio available.",
            avatarColor: profile.avatar_color || "#7CFF8A",
            initials: (profile.display_name || profile.handle || "U").substring(0, 2).toUpperCase(),
            online: false, // We'll add real presence later
            github: profile.github || "",
            portfolio: profile.portfolio || "",
            linkedin: profile.linkedin || "",
          };
          setUserProfile(formattedProfile);

          // 2. Fetch User's Posts
          const { data: profilePosts, error: postsError } = await supabase
            .from("posts")
            .select(`
              *,
              post_likes(user_id)
            `)
            .eq("author_id", profile.id)
            .order("created_at", { ascending: false });

          if (postsError) throw postsError;
          
          setUserPosts((profilePosts || []).map(p => ({
            id: p.id,
            type: p.type,
            title: p.title,
            timestamp: new Date(p.created_at).getTime(),
            likes: p.post_likes?.length || 0,
            comments: [] // We could fetch counts if needed
          })));

          if (profile.is_deactivated) {
            setUserProfile(null); // Treat as missing if deactivated
          }
        }
      } catch (err) {
        console.error("Error loading public profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [decodedHandle]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center gap-4 bg-[#080808]">
        <div className="w-12 h-12 border-4 border-[#7CFF8A]/30 border-t-[#7CFF8A] rounded-full animate-spin" />
        <p className="text-white/40 animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center gap-6 bg-[#080808]">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
           <MessageCircle size={32} className="text-white/20" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
          <p className="text-white/40">The user @{decodedHandle} doesn't seem to exist.</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-32 space-y-5 max-w-[800px] mx-auto px-4">
      {/* ─── Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 pb-4 bg-gradient-to-b from-[#080808] via-[#080808]/95 to-transparent flex items-center gap-3 pt-2">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-white flex-1">
          {userProfile.displayName}'s Profile
        </h1>
      </header>

      {/* ─── Hero Card ──────────────────────────────── */}
      <div className="bg-white/5 rounded-2xl border border-white/5 p-6 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50"
          style={{
            background: `radial-gradient(circle at top left, ${userProfile.avatarColor}30, transparent 60%),
                         radial-gradient(circle at top right, #7CFF8A20, transparent 60%)`,
          }}
        />

        <div className="relative flex flex-col md:flex-row gap-6 mt-6">
          <div className="relative shrink-0">
            <div
              className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center font-bold text-3xl relative z-10"
              style={{
                background: `${userProfile.avatarColor}20`,
                border: `4px solid #12001F`,
                color: userProfile.avatarColor,
                boxShadow: `0 0 24px ${userProfile.avatarColor}35`,
              }}
            >
              {userProfile.initials}
            </div>
            <div
              className="absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-[#12001F] z-20"
              style={{
                backgroundColor: userProfile.online ? "#7CFF8A" : "#4a4a5a",
              }}
            />
          </div>

          <div className="flex-grow pt-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {userProfile.displayName}
              </h2>
            </div>
            <p className="text-white/40 text-sm mb-1">@{userProfile.handle}</p>
            <p className="text-white/40 text-sm mb-4">
              {userProfile.dept} · {userProfile.year}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {userProfile.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/70 border border-white/5"
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* Links */}
            <div className="flex gap-3 flex-wrap">
              {userProfile.github && (
                <a
                  href={userProfile.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12001F] border border-white/10 hover:border-[#4DEFFF]/50 hover:text-[#4DEFFF] transition-colors text-xs font-medium text-white/60"
                >
                   GitHub
                </a>
              )}
              {userProfile.portfolio && (
                <a
                  href={userProfile.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12001F] border border-white/10 hover:border-[#FF5C8A]/50 hover:text-[#FF5C8A] transition-colors text-xs font-medium text-white/60"
                >
                   Portfolio
                </a>
              )}
              {userProfile.linkedin && (
                <a
                  href={userProfile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12001F] border border-white/10 hover:border-[#0A66C2]/50 hover:text-[#0A66C2] transition-colors text-xs font-medium text-white/60"
                >
                   LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bio ────────────────────────────────────── */}
      <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="text-[#FFD166]">✦</span> Bio
          </h3>
        </div>
        <p className="text-white/70 text-sm leading-relaxed">
          {userProfile.bio}
        </p>
      </div>

      {/* ─── Activity ───────────────────────────────── */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
        </div>

        {userPosts.length === 0 ? (
          <div className="text-white/40 text-sm text-center py-6 bg-white/5 rounded-2xl border border-white/5">
            No active posts
          </div>
        ) : (
          <div
            className="flex overflow-x-auto gap-4 pb-3 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {userPosts.map((post) => {
              const color = typeColors[post.type as keyof typeof typeColors] || "#7CFF8A";
              return (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="snap-center shrink-0 w-[280px] bg-white/5 rounded-2xl border border-white/5 p-4 relative overflow-hidden transition-all duration-300 cursor-pointer hover:border-white/10 block"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border"
                      style={{
                        color,
                        background: `${color}15`,
                        borderColor: `${color}30`,
                      }}
                    >
                      {post.type}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {Math.ceil(
                        (Date.now() - post.timestamp) / (1000 * 60 * 60)
                      )}
                      h ago
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium mb-3 line-clamp-2">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Heart size={11} /> {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={11} /> {post.comments?.length || 0}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
