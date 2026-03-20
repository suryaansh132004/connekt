"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PostCard, { PostType, typeColors } from "@/components/feed/PostCard";
import { useFeed } from "@/context/FeedContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { PostSkeleton } from "@/components/layout/Skeleton";

/* =========================================================
   🔹 Home Page
========================================================= */

export default function Home() {
  const { posts } = useFeed();
  const { profile } = useUserProfile();

  /* ----------------------------
     🔸 State
  ----------------------------- */

  const [activeFilter, setActiveFilter] = useState("all");
  const [feedMode, setFeedMode] = useState<"trending" | "new">("new");
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const postsPerPage = 5;

  useEffect(() => {
    if (posts.length > 0) {
      setIsLoading(false);
    } else {
      const timer = setTimeout(() => setIsLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [posts]);

  // Intersection Observer for infinite scrolling
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || isFetchingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setIsFetchingMore(true);
          // Simulate network request
          setTimeout(() => {
            setPage((prevPage) => prevPage + 1);
            setIsFetchingMore(false);
          }, 800);
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, isFetchingMore]
  );



  /* ----------------------------
     🔸 Filtering
  ----------------------------- */

  let filteredPosts = posts.filter((post) => {
    // Hide if targeted to another department
    if (post.targetDept && post.targetDept !== profile.dept) return false;
    
    // Hide if not matching active category tab
    if (activeFilter !== "all" && post.type !== activeFilter) return false;
    
    return true;
  });

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [activeFilter, feedMode]);

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
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
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
    <div className="pt-8 pb-28 space-y-6">
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
        {isLoading ? (
          <div className="space-y-6 fade-in">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 fade-in">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">📭</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No posts available</h3>
            <p className="text-white/50 text-sm text-center max-w-sm">
              It looks like there's nothing here yet. Check back later or start a new conversation yourself!
            </p>
          </div>
        ) : (
          <>
            {filteredPosts.slice(0, page * postsPerPage).map((post, index) => {
              const isLastElement = index === filteredPosts.slice(0, page * postsPerPage).length - 1;
              return (
                <div key={post.id} ref={isLastElement ? lastPostElementRef : null}>
                  <PostCard
                    id={post.id}
                    type={post.type}
                    title={post.title}
                    content={post.content}
                    author={post.author}
                    timestamp={post.timestamp as number}
                    tags={post.tags}
                    likes={post.likes}
                    isLiked={post.isLiked}
                    comments={post.comments}
                    targetDept={post.targetDept}
                  />
                </div>
              );
            })}
            {isFetchingMore && filteredPosts.length > page * postsPerPage && (
              <div className="py-4 fade-in">
                <PostSkeleton />
              </div>
            )}
            {filteredPosts.length <= page * postsPerPage && filteredPosts.length > 0 && (
              <div className="text-center text-white/40 text-sm py-8 fade-in">
                You've caught up on all the posts!
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
