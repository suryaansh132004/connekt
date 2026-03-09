"use client";

import { useState, useMemo } from "react";
import { useFeed } from "@/context/FeedContext";
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

const mockPeople = [
  {
    id: "p1",
    name: "Aarav Sharma",
    dept: "CS",
    year: "Sophomore",
    role: "React & AI",
    online: true,
    initials: "AS",
    color: "#7CFF8A",
  },
  {
    id: "p2",
    name: "Megha Pandey",
    dept: "ECE",
    year: "Junior",
    role: "ML / Research",
    online: false,
    initials: "MP",
    color: "#4DEFFF",
  },
  {
    id: "p3",
    name: "Rahul Khanna",
    dept: "Design",
    year: "Senior",
    role: "UI/UX & Figma",
    online: true,
    initials: "RK",
    color: "#FF5C8A",
  },
  {
    id: "p4",
    name: "Divya Menon",
    dept: "CS",
    year: "Freshman",
    role: "Flutter & Mobile",
    online: false,
    initials: "DM",
    color: "#FFD166",
  },
];

const mockCommunities = [
  {
    id: "c1",
    name: "Hackathon Club",
    members: 245,
    events: 12,
    color: "#4DEFFF",
    icon: "⚡",
  },
  {
    id: "c2",
    name: "AI Society",
    members: 189,
    events: 8,
    color: "#7CFF8A",
    icon: "🤖",
  },
  {
    id: "c3",
    name: "Design Hub",
    members: 134,
    events: 5,
    color: "#FF5C8A",
    icon: "🎨",
  },
];

const mockProjects = [
  {
    id: "pr1",
    title: "AI Campus Guide",
    desc: "Specialized LLM wrapper for campus resources.",
    tags: ["Python", "React"],
    type: "collab" as const,
  },
  {
    id: "pr2",
    title: "CampusMap AR",
    desc: "AR overlay navigation app for new students.",
    tags: ["ARKit", "Swift"],
    type: "collab" as const,
  },
];

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

  /* ----------------------------
     🔸 Filtered Results
  ----------------------------- */

  const q = query.toLowerCase().trim();

  const filteredPeople = useMemo(
    () =>
      mockPeople.filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.dept.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q)
      ),
    [q]
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
      mockCommunities.filter(
        (c) => !q || c.name.toLowerCase().includes(q)
      ),
    [q]
  );

  const filteredProjects = useMemo(
    () =>
      mockProjects.filter(
        (p) =>
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      ),
    [q]
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

        {/* Tab Pills */}
        <div className="flex overflow-x-auto gap-2 mt-4 pb-2 border-b border-white/5 no-scrollbar">
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
      </header>

      {/* ─── Results ────────────────────────────────────── */}
      <div className="mt-4 space-y-3">
        <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">
          {q ? `Results for "${query}"` : "Top Results"}
        </p>

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
                    <h3 className="font-semibold text-white group-hover:text-[#7CFF8A] transition-colors">
                      {person.name}
                    </h3>
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
              <article
                key={community.id}
                className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-4 transition-all duration-300 cursor-pointer group"
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
              </article>
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
                <article
                  key={project.id}
                  className="relative bg-white/5 border border-white/5 hover:border-[#7CFF8A]/30 rounded-2xl overflow-hidden p-4 pl-6 transition-all duration-300 cursor-pointer group"
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
                </article>
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
