"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { useFeed } from "@/context/FeedContext";
import { supabase } from "@/lib/supabase";
import { SearchSkeleton } from "@/components/layout/Skeleton";
import { typeColors } from "@/components/feed/PostCard";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Heart,
  MessageCircle,
  X,
} from "lucide-react";

/* =========================================================
   🔹 Types
========================================================= */

type Tab = "People" | "Posts" | "Communities" | "Projects" | "Events";

/* =========================================================
   🔹 Mock Data
========================================================= */



/* =========================================================
   🔹 Component
========================================================= */

export default function SearchPage() {
  const { posts } = useFeed();

  /* ----------------------------
     🔸 State
  ----------------------------- */

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("People");
  const [showFilters, setShowFilters] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [realPeople, setRealPeople] = useState<any[]>([]);

  // Debounce the raw query to 300ms so we don't rerender complex lists every character Typed
  const debouncedQuery = useDebounce(query, 300);

  // Fetch real people from Supabase
  useEffect(() => {
    const fetchPeople = async () => {
      setIsLoading(true);
      try {
        let queryBuilder = supabase
          .from("profiles")
          .select("*")
          .eq("is_deactivated", false);

        if (debouncedQuery) {
          queryBuilder = queryBuilder.or(`display_name.ilike.%${debouncedQuery}%,handle.ilike.%${debouncedQuery}%,dept.ilike.%${debouncedQuery}%`);
        }

        const { data, error } = await queryBuilder.limit(20);
        if (error) throw error;
        setRealPeople(data || []);
      } catch (err) {
        console.error("Error fetching people:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPeople();
  }, [debouncedQuery]);

  /* ----------------------------
     🔸 Filtered Results
  ----------------------------- */

  const [realCommunities, setRealCommunities] = useState<any[]>([]);
  
  // Fetch real communities from Supabase
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        let queryBuilder = supabase
          .from("conversations")
          .select("*")
          .eq("type", "community")
          .is("deleted_at", null);

        if (debouncedQuery) {
          queryBuilder = queryBuilder.ilike("name", `%${debouncedQuery}%`);
        }

        const { data, error } = await queryBuilder.limit(10);
        if (error) throw error;
        setRealCommunities(data || []);
      } catch (err) {
        console.error("Error fetching communities:", err);
      }
    };
    fetchCommunities();
  }, [debouncedQuery]);

  /* ----------------------------
     🔸 Filtered Results
  ----------------------------- */

  const q = debouncedQuery.toLowerCase().trim();

  const filteredPeople = useMemo(
    () =>
      realPeople.map(p => ({
        id: p.id,
        name: p.display_name || "Anonymous",
        dept: p.dept || "N/A",
        year: p.year || "",
        role: p.bio ? (p.bio.length > 30 ? p.bio.substring(0, 30) + "..." : p.bio) : "Student",
        online: false, // We don't have real-time presence yet
        initials: (p.display_name || "U").charAt(0).toUpperCase(),
        color: p.avatar_color || "#7CFF8A",
      })),
    [realPeople]
  );

  const filteredPosts = useMemo(
    () =>
      posts.filter(
        (p) =>
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      ),
    [posts, q]
  );

  const filteredCommunities = useMemo(
    () =>
      realCommunities.map(c => ({
        id: c.id,
        name: c.name,
        members: 0, // In a real app, we'd join with conversation_participants count
        events: 0,
        color: c.avatar_color || "#4DEFFF",
        icon: "🌍",
      })),
    [realCommunities]
  );

  const filteredProjects = useMemo(
    () =>
      posts
        .filter(p => p.type === "collab")
        .filter(
          (p) =>
            !q ||
            p.title.toLowerCase().includes(q) ||
            p.content.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        )
        .map(p => ({
          id: p.id,
          title: p.title,
          desc: p.content,
          tags: p.tags,
          type: "collab" as const,
        })),
    [posts, q]
  );

  const filteredEvents = useMemo(
    () =>
      posts
        .filter((p) => p.type === "event")
        .filter(
          (p) =>
            !q ||
            p.title.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        ),
    [posts, q]
  );

  /* ----------------------------
     🔸 Toggle helpers
  ----------------------------- */

  const toggleFollow = (id: string) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleJoin = (id: string) => {
    setJoined((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const tabs: Tab[] = ["People", "Posts", "Communities", "Projects", "Events"];

  /* =========================================================
     🔹 UI
  ========================================================= */

  return (
    <div className="min-h-screen pb-28">
      {/* ─── Sticky Header ─────────────────────────────── */}
      <header className="sticky top-0 z-40 pt-8 pb-2 bg-gradient-to-b from-[#12001F] via-[#12001F]/95 to-transparent backdrop-blur-sm">

        {/* Title */}
        <h1 className="text-3xl font-bold mb-5">Discover</h1>

        {/* Search Input */}
        <div
          className={`flex items-center gap-3 bg-white/5 border rounded-xl px-4 py-3 transition-all duration-300 ${
            query
              ? "border-[#7CFF8A]/60 shadow-[0_0_15px_rgba(122,255,136,0.2)]"
              : "border-white/10"
          }`}
        >
          <Search
            size={18}
            className={`shrink-0 transition-colors ${
              query ? "text-[#7CFF8A]" : "text-white/40"
            }`}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, projects, lore..."
            className="bg-transparent flex-1 text-white placeholder:text-white/40 text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`transition-colors ${
              showFilters ? "text-[#7CFF8A]" : "text-white/40 hover:text-white"
            }`}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </header>

        {/* ─── Dynamic Content Area ──────────────────────── */}
        {!query ? (
          <div className="space-y-10 mt-6 pb-20 fade-in grow">
            {/* 1. Trending Topics */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🔥</span> Trending Topics
              </h2>
              <div className="flex flex-wrap gap-3">
                {["Hackathon", "Midsems", "Figma", "ReactJS", "MachineLearning"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-[#FFD166] hover:bg-[#FFD166]/10 hover:border-[#FFD166]/30 transition-all font-medium"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </section>

            {/* 2. Suggested Connections */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">👋</span> Discover People
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {filteredPeople.slice(0, 3).map((person) => (
                  <article
                    key={person.id}
                    className="flex items-center justify-between bg-white/5 border border-white/5 hover:border-[#7CFF8A]/30 rounded-2xl p-4 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2"
                          style={{
                            background: `${person.color}20`,
                            borderColor: `${person.color}50`,
                            color: person.color,
                          }}
                        >
                          {person.initials}
                        </div>
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#12001F]"
                          style={{
                            backgroundColor: person.online ? "#7CFF8A" : "#4a4a5a",
                          }}
                        />
                      </div>
                      <div>
                        <Link href={`/profile/${person.name}`} className="font-semibold text-white group-hover:text-[#7CFF8A] transition-colors line-clamp-1 block w-fit">
                          {person.name}
                        </Link>
                        <p className="text-xs text-white/40 mt-0.5">
                          {person.dept} · {person.role}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollow(person.id);
                      }}
                      className={`p-2 rounded-full transition-all duration-200 active:scale-95 shrink-0 ${
                        following.has(person.id)
                          ? "bg-[#7CFF8A] text-[#12001F]"
                          : "bg-white/5 text-[#7CFF8A] hover:bg-[#7CFF8A] hover:text-[#12001F]"
                      }`}
                    >
                      <UserPlus size={18} />
                    </button>
                  </article>
                ))}
              </div>
            </section>

            {/* 3. Featured Communities */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🌍</span> Top Communities
              </h2>
              <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
                {realCommunities.slice(0, 5).map((community) => (
                  <Link
                    key={community.id}
                    href={`/community/${community.id}`}
                    className="shrink-0 w-60 flex flex-col items-center justify-center bg-white/5 border border-white/10 hover:border-white/30 rounded-3xl p-6 transition-all cursor-pointer"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold mb-4"
                      style={{
                        background: `linear-gradient(135deg, ${community.avatar_color || "#7CFF8A"}30, ${community.avatar_color || "#7CFF8A"}10)`,
                        border: `1px solid ${community.avatar_color || "#7CFF8A"}40`,
                        color: community.avatar_color || "#7CFF8A",
                      }}
                    >
                      🌍
                    </div>
                    <h3 className="font-semibold text-white text-center line-clamp-1">{community.name}</h3>
                    <p className="text-xs text-white/40 mt-1 mb-4 text-center">
                      Community
                    </p>
                    <div className="w-full py-2 rounded-xl text-xs text-center font-semibold border border-white/10 text-white hover:bg-white hover:text-[#12001F] transition-all">
                      View Community
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="fade-in">
            {/* Tab Pills */}
            <div className="flex overflow-x-auto gap-2 pb-2 border-b border-white/5 no-scrollbar">
              {tabs.map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95 ${
                      active
                        ? "bg-[#7CFF8A]/10 border border-[#7CFF8A]/30 text-[#7CFF8A] shadow-[0_0_10px_rgba(122,255,136,0.15)]"
                        : "bg-white/5 border border-white/5 text-white/50 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Filter Chips */}
            {showFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pb-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {["Department", "Year", "Skills", "Tags"].map((f) => (
                  <button
                    key={f}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 hover:border-[#7CFF8A]/40 hover:text-white transition-colors"
                  >
                    <span>{f}</span>
                    <ChevronDown size={12} />
                  </button>
                ))}
                <button
                  onClick={() => {}}
                  className="text-xs text-[#7CFF8A] ml-auto pt-1 hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* ─── Results ────────────────────────────────────── */}
            <div className="mt-4 space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">
                {q ? `Results for "${query}"` : "Top Results"}
              </p>

              {isLoading ? (
                <SearchSkeleton />
              ) : (
                <>
                  {/* ── PEOPLE ── */}
              {activeTab === "People" && (
                <>
                  {filteredPeople.length === 0 && <EmptyState />}
                  {filteredPeople.map((person) => (
                    <article
                      key={person.id}
                      className="flex items-center justify-between bg-white/5 border border-white/5 hover:border-[#7CFF8A]/30 rounded-2xl p-4 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {/* Avatar with initials */}
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2"
                            style={{
                              background: `${person.color}20`,
                              borderColor: `${person.color}50`,
                              color: person.color,
                            }}
                          >
                            {person.initials}
                          </div>
                          {/* Online dot */}
                          <div
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#12001F]"
                            style={{
                              backgroundColor: person.online ? "#7CFF8A" : "#4a4a5a",
                            }}
                          />
                        </div>
                        <div>
                          <Link href={`/profile/${person.name}`} className="font-semibold text-white group-hover:text-[#7CFF8A] transition-colors block w-fit">
                            {person.name}
                          </Link>
                          <p className="text-xs text-white/40 mt-0.5">
                            {person.dept} · {person.year} · {person.role}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollow(person.id);
                        }}
                        className={`p-2 rounded-full transition-all duration-200 active:scale-95 ${
                          following.has(person.id)
                            ? "bg-[#7CFF8A] text-[#12001F]"
                            : "bg-white/5 text-[#7CFF8A] hover:bg-[#7CFF8A] hover:text-[#12001F]"
                        }`}
                      >
                        <UserPlus size={18} />
                      </button>
                    </article>
                  ))}
                </>
              )}

              {/* ── POSTS ── */}
              {activeTab === "Posts" && (
                <>
                  {filteredPosts.length === 0 && <EmptyState />}
                  {filteredPosts.map((post) => {
                    const color = typeColors[post.type];
                    return (
                      <article
                        key={post.id}
                        className="relative bg-white/5 border border-white/5 rounded-2xl overflow-hidden p-4 pl-6 transition-all duration-300 group cursor-pointer"
                        style={{
                          ["--hover-color" as string]: color,
                        }}
                      >
                        {/* Left accent bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                          style={{
                            background: color,
                            boxShadow: `0 0 10px ${color}55`,
                          }}
                        />
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-2">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color }}
                            >
                              {post.type}
                            </span>
                            <h3
                              className="font-semibold text-white mt-1 truncate transition-colors"
                              style={{ ["--tw-text-opacity" as string]: "1" }}
                            >
                              {post.title}
                            </h3>
                            <p className="text-xs text-white/40 mt-1 line-clamp-1">
                              {post.content}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-white/30 shrink-0 mt-1" />
                        </div>
                        {/* Tags */}
                        {post.tags.length > 0 && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/50"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-white/40">
                            {post.type === "lore" ? "Anonymous" : post.author}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-white/40">
                            <span className="flex items-center gap-1">
                              <Heart size={11} /> {post.likes}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </>
              )}

              {/* ── COMMUNITIES ── */}
              {activeTab === "Communities" && (
                <>
                  {filteredCommunities.length === 0 && <EmptyState />}
                  {filteredCommunities.map((community) => (
                    <Link
                      key={community.id}
                      href={`/community/${community.name}`}
                      className="flex items-center justify-between bg-white/5 border border-white/5 hover:border-[#7CFF8A]/30 rounded-2xl p-4 transition-all duration-300 cursor-pointer group"
                      style={{
                        ["--hover-border" as string]: `${community.color}50`,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${community.color}30, ${community.color}10)`,
                            border: `1px solid ${community.color}40`,
                          }}
                        >
                          {community.icon}
                        </div>
                        <div>
                          <h3
                            className="font-semibold text-white transition-colors"
                            style={{ color: undefined }}
                          >
                            {community.name}
                          </h3>
                          <p className="text-xs text-white/40 mt-0.5">
                            {community.members} Members · {community.events} Active Events
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleJoin(community.id);
                        }}
                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 active:scale-95 ${
                          joined.has(community.id)
                            ? "bg-[#7CFF8A]/20 border-[#7CFF8A]/40 text-[#7CFF8A]"
                            : "border-white/10 text-white/70 hover:bg-white hover:text-[#12001F]"
                        }`}
                      >
                        {joined.has(community.id) ? "Joined ✓" : "Join"}
                      </button>
                    </Link>
                  ))}
                </>
              )}

              {/* ── PROJECTS ── */}
              {activeTab === "Projects" && (
                <>
                  {filteredProjects.length === 0 && <EmptyState />}
                  {filteredProjects.map((project) => {
                    const color = typeColors[project.type];
                    return (
                      <Link
                        key={project.id}
                        href={`/community/${project.title}`}
                        className="relative bg-white/5 border border-white/5 hover:border-[#7CFF8A]/30 rounded-2xl overflow-hidden p-4 pl-6 transition-all duration-300 cursor-pointer group block"
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                          style={{
                            background: color,
                            boxShadow: `0 0 10px ${color}55`,
                          }}
                        />
                        <div className="flex justify-between items-start">
                          <div>
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color }}
                            >
                              Project
                            </span>
                            <h3 className="font-semibold text-white mt-1 group-hover:text-[#7CFF8A] transition-colors">
                              {project.title}
                            </h3>
                            <p className="text-xs text-white/40 mt-1">{project.desc}</p>
                          </div>
                          <ChevronRight size={16} className="text-white/30 mt-1 shrink-0" />
                        </div>
                        <div className="flex gap-2 mt-3">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/50"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </Link>
                    );
                  })}
                </>
              )}

              {/* ── EVENTS ── */}
              {activeTab === "Events" && (
                <>
                  {filteredEvents.length === 0 && <EmptyState />}
                  {filteredEvents.map((event) => (
                    <article
                      key={event.id}
                      className="relative bg-white/5 border border-white/5 hover:border-[#4DEFFF]/30 rounded-2xl overflow-hidden p-4 pl-6 transition-all duration-300 cursor-pointer group"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                        style={{
                          background: "#4DEFFF",
                          boxShadow: "0 0 10px rgba(77,239,255,0.4)",
                        }}
                      />
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4DEFFF]">
                            Event
                          </span>
                          <h3 className="font-semibold text-white mt-1 group-hover:text-[#4DEFFF] transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-xs text-white/40 mt-1 line-clamp-1">
                            {event.content}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-white/30 mt-1 shrink-0" />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-2">
                          {event.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/50"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <Heart size={11} /> {event.likes}
                        </span>
                      </div>
                    </article>
                  ))}
                </>
              )}
            </>
          )}

          {/* Footer */}
          <div className="h-16 flex items-center justify-center text-white/20 text-sm">
                {activeTab === "People" && filteredPeople.length > 0 && "No more people"}
                {activeTab === "Posts" && filteredPosts.length > 0 && "No more posts"}
                {activeTab === "Communities" && filteredCommunities.length > 0 && "No more communities"}
                {activeTab === "Projects" && filteredProjects.length > 0 && "No more projects"}
                {activeTab === "Events" && filteredEvents.length > 0 && "No more events"}
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

/* =========================================================
   🔹 Empty State
========================================================= */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-2xl">
        🔍
      </div>
      <p className="text-white/50 text-sm font-medium">No results found</p>
      <p className="text-white/30 text-xs mt-1">Try a different keyword or filter</p>
    </div>
  );
}
