"use client";

import Link from "next/link";
import { useFeed } from "@/context/FeedContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useAuth } from "@/context/AuthContext";
import { typeColors } from "@/components/feed/PostCard";
import {
  Settings,
  Share2,
  LogOut,
  Pencil,
  Code2,
  Globe,
  Heart,
  MessageCircle,
  Linkedin,
} from "lucide-react";

/* =========================================================
   🔹 Page
========================================================= */

export default function ProfilePage() {
  const { posts } = useFeed();
  const { profile } = useUserProfile();
  const { logout } = useAuth();

  const myPosts = posts.slice(0, 3);

  return (
    <div className="min-h-screen pt-6 pb-32 space-y-5 max-w-[800px] mx-auto">

      {/* ─── Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 pb-4 bg-gradient-to-b from-[#080808] via-[#080808]/95 to-transparent flex items-center gap-3 pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-white flex-1">
          Profile
        </h1>
        <button className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white">
          <Share2 size={20} />
        </button>
        <Link
          href="/settings"
          className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-[#7CFF8A]"
        >
          <Settings size={20} />
        </Link>
        <button
          onClick={logout}
          className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-[#FF5C8A]"
          title="Log out"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* ─── Hero Card ──────────────────────────────── */}
      <div className="bg-white/5 rounded-2xl border border-white/5 p-6 relative overflow-hidden">
        {/* Banner gradient */}
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50"
          style={{
            background: `radial-gradient(circle at top left, ${profile.avatarColor}30, transparent 60%),
                        radial-gradient(circle at top right, #7CFF8A20, transparent 60%)`,
          }}
        />

        <div className="relative flex flex-col md:flex-row gap-6 mt-6">
          {/* Avatar — click pencil to go to settings profile tab */}
          <div className="relative shrink-0">
            <div
              className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center font-bold text-3xl relative z-10"
              style={{
                background: `${profile.avatarColor}20`,
                border: `4px solid #12001F`,
                color: profile.avatarColor,
                boxShadow: `0 0 24px ${profile.avatarColor}35`,
              }}
            >
              {profile.initials}
            </div>
            {/* Pencil → settings profile tab */}
            <Link
              href="/settings?tab=profile"
              className="absolute bottom-0 right-0 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              style={{ background: profile.avatarColor, color: "#12001F" }}
            >
              <Pencil size={14} />
            </Link>
          </div>

          {/* Info */}
          <div className="flex-grow pt-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {profile.displayName}
              </h2>
              {profile.privacy.showOnlineStatus && (
                <span className="px-3 py-1 rounded-full bg-[#7CFF8A]/10 text-[#7CFF8A] border border-[#7CFF8A]/20 text-xs font-bold uppercase tracking-wider self-start md:self-auto">
                  Online
                </span>
              )}
            </div>

            <p className="text-white/40 text-sm mb-1">
              @{profile.handle}
            </p>
            <p className="text-white/40 text-sm mb-4">
              {profile.dept} · {profile.year}
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/70 border border-white/5 hover:border-[#7CFF8A]/40 transition-colors"
                >
                  {skill}
                </span>
              ))}
              <Link
                href="/settings?tab=profile"
                className="px-3 py-1 rounded-full border border-dashed border-white/20 text-xs text-white/40 hover:text-white hover:border-white/40 transition-colors flex items-center gap-1"
              >
                <Pencil size={10} /> Edit
              </Link>
            </div>

            {/* Links */}
            <div className="flex gap-3 flex-wrap">
              {profile.github && (
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12001F] border border-white/10 hover:border-[#4DEFFF]/50 hover:text-[#4DEFFF] transition-colors text-xs font-medium text-white/60"
                >
                  <Code2 size={14} /> GitHub
                </a>
              )}
              {profile.portfolio && (
                <a
                  href={profile.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12001F] border border-white/10 hover:border-[#FF5C8A]/50 hover:text-[#FF5C8A] transition-colors text-xs font-medium text-white/60"
                >
                  <Globe size={14} /> Portfolio
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12001F] border border-white/10 hover:border-[#0A66C2]/50 hover:text-[#0A66C2] transition-colors text-xs font-medium text-white/60"
                >
                  <Linkedin size={14} /> LinkedIn
                </a>
              )}
              {!profile.github && !profile.portfolio && !profile.linkedin && (
                <Link
                  href="/settings?tab=profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12001F] border border-dashed border-white/10 hover:border-[#7CFF8A]/40 transition-colors text-xs font-medium text-white/30"
                >
                  + Add links in settings
                </Link>
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
          {profile.bio && (
            <Link
              href="/settings?tab=profile"
              className="text-xs text-white/40 hover:text-[#7CFF8A] transition-colors"
            >
              Edit
            </Link>
          )}
        </div>
        <p className="text-white/70 text-sm leading-relaxed">
          {profile.bio || (
            <span className="text-white/30 italic">
              No bio yet.{" "}
              <Link href="/settings?tab=profile" className="underline hover:text-[#7CFF8A]">
                Add one
              </Link>
            </span>
          )}
        </p>
      </div>

      {/* ─── Activity ───────────────────────────────── */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">My Activity</h3>
          <button className="text-sm text-[#7CFF8A] hover:underline">
            View All
          </button>
        </div>

        <div
          className="flex overflow-x-auto gap-4 pb-3 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {myPosts.map((post) => {
            const color = typeColors[post.type];
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
                    {Math.ceil((Date.now() - Number(post.timestamp)) / (1000 * 60 * 60))}h ago
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
                    <MessageCircle size={11} /> 0
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── Danger Zone ────────────────────────────── */}
      <div className="border border-red-500/20 rounded-2xl p-6 bg-red-500/5">
        <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider mb-4">
          Danger Zone
        </h3>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-white text-sm font-medium">Deactivate Account</p>
            <p className="text-white/40 text-xs mt-0.5">
              Hide your profile and activity temporarily.
            </p>
          </div>
          <Link
            href="/settings?tab=account"
            className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-sm font-medium shrink-0"
          >
            Manage
          </Link>
        </div>
      </div>
    </div>
  );
}
