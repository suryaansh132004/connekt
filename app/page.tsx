"use client";

import { useState } from "react";
import PostCard, { PostType, typeColors } from "@/components/feed/PostCard";
import { useFeed } from "@/context/FeedContext";

/* =========================================================
   🔹 Home Page
========================================================= */

export default function Home() {
  const { posts } = useFeed();

  /* ----------------------------
     🔸 State
  ----------------------------- */

  const [activeFilter, setActiveFilter] = useState("all");
  const [feedMode, setFeedMode] = useState<"trending" | "new">("new");

  /* ----------------------------
     🔸 Format Timestamp
  ----------------------------- */

  function formatTimestamp(timestamp: number) {
    const diffMs = Date.now() - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours === 1) return "1h ago";
    return `${diffHours}h ago`;
  }

  /* ----------------------------
     🔸 Filtering
  ----------------------------- */

  let filteredPosts =
    activeFilter === "all"
      ? posts
      : posts.filter((post) => post.type === activeFilter);

  /* ----------------------------
     🔸 Sorting
  ----------------------------- */

  if (feedMode === "trending") {
    filteredPosts = [...filteredPosts].sort(
      (a, b) => b.likes - a.likes
    );
  }

  if (feedMode === "new") {
    filteredPosts = [...filteredPosts].sort(
      (a, b) => b.timestamp - a.timestamp
    );
  }

  /* ----------------------------
     🔸 Filter Options
  ----------------------------- */

  const filters: ("all" | PostType)[] = [
    "all",
    "collab",
    "event",
    "question",
    "lore",
  ];

  /* =========================================================
     🔹 UI
  ========================================================= */

  return (
    <div className="pt-8 space-y-6">
      <h1 className="text-3xl font-bold">Home</h1>

      {/* Filter Tabs */}
      <div className="relative w-full overflow-x-auto">
        <div className="flex gap-6 px-1 py-2">
          {filters.map((filter) => {
            const active = activeFilter === filter;

            const color =
              filter === "all"
                ? "#ffffff"
                : typeColors[filter as PostType];

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`text-base capitalize transition-all duration-300 ${
                  active ? "font-semibold" : "font-medium"
                }`}
                style={{
                  color: active
                    ? color
                    : "rgba(255,255,255,0.6)",
                }}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending / New Toggle */}
      <div className="flex justify-start">
        <div className="relative w-56 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1 flex overflow-hidden">
          <div
            className={`absolute top-1 left-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)] 
            rounded-full bg-white/10 transition-transform duration-300 ease-in-out
            ${feedMode === "new" ? "translate-x-full" : "translate-x-0"}`}
          />

          <button
            onClick={() => setFeedMode("trending")}
            className={`relative z-10 w-1/2 text-sm py-1.5 transition-colors ${
              feedMode === "trending"
                ? "text-white font-medium"
                : "text-white/60"
            }`}
          >
            Trending
          </button>

          <button
            onClick={() => setFeedMode("new")}
            className={`relative z-10 w-1/2 text-sm py-1.5 transition-colors ${
              feedMode === "new"
                ? "text-white font-medium"
                : "text-white/60"
            }`}
          >
            New
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            type={post.type}
            title={post.title}
            content={post.content}
            author={post.author}
            timestamp={formatTimestamp(post.timestamp)}
            tags={post.tags}
            likes={post.likes}
          />
        ))}
      </div>
    </div>
  );
}
