"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Flag, MoreVertical, Trash2, Edit2, Check, X as XIcon } from "lucide-react";
import { useFeed, Comment } from "@/context/FeedContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useToast } from "@/context/ToastContext";

/* =========================================================
   🔹 Post Types
========================================================= */

export type PostType = "collab" | "event" | "question" | "lore";

/* =========================================================
   🔹 Props
========================================================= */

interface PostCardProps {
  id: string;
  type: PostType;
  title: string;
  content: string;
  author?: string;
  timestamp: number;
  tags?: string[];
  likes?: number;
  isLiked?: boolean;
  comments?: Comment[];
  targetDept?: string;
}

/* =========================================================
   🔹 Accent Colors
========================================================= */

export const typeColors: Record<PostType, string> = {
  collab: "#7CFF8A",
  event: "#4DEFFF",
  question: "#FFD166",
  lore: "#FF5C8A",
};

/* =========================================================
   🔹 Component
========================================================= */
export default function PostCard({
  id,
  type,
  title,
  content,
  author,
  timestamp,
  tags = [],
  likes = 0,
  isLiked = false,
  comments = [],
  targetDept,
}: PostCardProps) {
  const { likePost, addComment, deletePost, editPost, deleteComment } = useFeed();
  const { profile } = useUserProfile();
  const { toast } = useToast();

  /* ---------------------------
     🔸 Local State
  ---------------------------- */

  const [lastTap, setLastTap] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  
  // Edit & Menu State
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const menuRef = useRef<HTMLDivElement>(null);

  // --- Timestamp & Edit Constraint Logic ---
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000); // refresh every minute
    return () => clearInterval(timer);
  }, []);

  const formatTimestamp = (ts: number) => {
    const diffMs = now - ts;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours === 1) return "1h ago";
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const isAuthor = profile?.handle === author || author === "You" || profile?.displayName === author;
  const canEdit = isAuthor && (now - timestamp < 10 * 60 * 1000);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------------------------
     🔸 Like Handler
  ---------------------------- */

  const handleLike = () => {
    // With real-time, we just call likePost in context
    // The UI will update when the postgres change comes in
    // or we can optimistic update here if desired.
    likePost(id);
    toast(isLiked ? "Like removed" : "Post liked!", "success");
  };

  /* ---------------------------
     🔸 Add Comment
  ---------------------------- */

  const handleAddComment = () => {
    if (newComment.trim() === "") return;

    addComment(id, {
      id: crypto.randomUUID(),
      text: newComment,
      author: profile?.displayName || "You",
      authorId: profile?.handle || "", // temporary until we have real user IDs in context
      timestamp: "Just now",
    });
    setNewComment("");
    toast("Comment added!", "success");
  };

  return (
        <div
            className="relative group transition-all duration-300 hover:-translate-y-1 active:scale-[0.99]"
            onClick={() => {
                const now = Date.now();
                const DOUBLE_TAP_DELAY = 300;

                if (now - lastTap < DOUBLE_TAP_DELAY) {
                if (!isLiked) {
                    handleLike();
                }
                }

                setLastTap(now);
            }}
        >


      {/* Card Container */}
      <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 overflow-hidden">

        {/* Bottom Underglow */}
        <div
          className="absolute bottom-0 left-0 w-full h-14 pointer-events-none"
          style={{
            background: `
              linear-gradient(
                to top,
                ${typeColors[type]}66 0%,
                ${typeColors[type]}33 40%,
                transparent 100%
              )
            `,
          }}
        />

        {/* Top Row */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium px-3 py-1 rounded-full border"
              style={{
                color: typeColors[type],
                borderColor: `${typeColors[type]}55`,
                backgroundColor: `${typeColors[type]}15`,
              }}
            >
              {type.toUpperCase()}
            </span>
            {targetDept && (
              <span className="text-[10px] font-bold px-2 py-1 rounded border border-white/10 bg-white/5 text-white/60">
                🎯 {targetDept} ONLY
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40">{formatTimestamp(timestamp)}</span>
            {/* Author Actions Menu */}
            {isAuthor && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                >
                  <MoreVertical size={16} />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-36 bg-[#1A0B2E] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 isolate">
                    {canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        <Edit2 size={14} /> Edit Post
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePost(id);
                        setShowMenu(false);
                        toast("Post deleted", "success");
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-400/10 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={14} /> Delete Post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-white mb-3">
          {title}
        </h2>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content & Edit Mode */}
        {isEditing ? (
          <div className="mb-4 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7CFF8A]/50 resize-none"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                  setEditContent(content); // cancel
                }}
                className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors"
                title="Cancel"
              >
                <XIcon size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  editPost(id, editContent);
                  setIsEditing(false);
                  toast("Post updated", "success");
                }}
                className="p-1.5 rounded-lg bg-[#7CFF8A]/20 text-[#7CFF8A] hover:bg-[#7CFF8A]/30 transition-colors"
                title="Save Changes"
              >
                <Check size={16} />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            {content}
          </p>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-white/50">

          <span className="relative z-10">
            {type === "lore" ? "Anonymous" : (
              <Link
                href={`/profile/${author}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-white transition-colors hover:underline"
              >
                {author}
              </Link>
            )}
          </span>

          <div className="flex items-center gap-6">

            {/* Like */}
            <button
            onClick={(e) => {
                e.stopPropagation(); // prevents triggering double tap
                handleLike();
            }}
            className={`flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 ${
                isLiked ? "text-pink-400" : "hover:text-white"
            }`}
            >
            <Heart
                size={16}
                strokeWidth={1.5}
                fill={isLiked ? "currentColor" : "none"}
            />
            <span>{likes}</span>
            </button>


            {/* Comment Toggle */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <MessageCircle size={16} strokeWidth={1.5} />
              <span>{comments.length}</span>
            </button>

            {/* Report */}
            <button className="hover:text-white transition-all duration-200 hover:scale-105 active:scale-95">
              <Flag size={16} strokeWidth={1.5} />
            </button>

          </div>
        </div>

        {/* =====================================================
           🔸 Comment Section Dropdown
        ====================================================== */}

        {showComments && (
          <div className="mt-5 border-t border-white/10 pt-4 space-y-3">

            {/* Existing Comments */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {comments.map((comment, index) => {
                const isCommentAuthor = profile?.displayName === comment.author || comment.author === "You";
                return (
                  <div
                    key={comment.id || index}
                    className="text-sm bg-white/5 px-3 py-2 rounded-lg flex justify-between items-start group/comment"
                  >
                    <div>
                      <p className="font-semibold text-white/90 text-xs mb-1">
                        {comment.author}{" "}
                        <span className="font-normal text-white/30 text-[10px] ml-1">
                          {comment.timestamp}
                        </span>
                      </p>
                      <p className="text-white/70">{comment.text}</p>
                    </div>
                    {isCommentAuthor && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteComment(id, comment.id);
                        }}
                        className="opacity-0 group-hover/comment:opacity-100 p-1 text-white/30 hover:text-red-400 hover:bg-white/5 rounded transition-all"
                        title="Delete Comment"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Comment Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
              />
              <button
                onClick={handleAddComment}
                className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                Post
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
