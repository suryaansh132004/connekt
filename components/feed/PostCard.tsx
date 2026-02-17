"use client";

import { useState } from "react";
import { Heart, MessageCircle, Flag } from "lucide-react";

/* =========================================================
   🔹 Post Types
========================================================= */

export type PostType = "collab" | "event" | "question" | "lore";

/* =========================================================
   🔹 Props
========================================================= */

interface PostCardProps {
  type: PostType;
  title: string;
  content: string;
  author?: string;
  timestamp: string;
  tags?: string[];
  likes?: number;
  comments?: number;
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
  type,
  title,
  content,
  author,
  timestamp,
  tags = [],
  likes = 0,
}: PostCardProps) {

  /* ---------------------------
     🔸 Local State
  ---------------------------- */

  const [likeCount, setLikeCount] = useState(likes);
  const [liked, setLiked] = useState(false);
const [lastTap, setLastTap] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState<string[]>([
    "Looks interesting!",
    "I'm in 👀",
  ]);
  const [newComment, setNewComment] = useState("");

  /* ---------------------------
     🔸 Like Handler
  ---------------------------- */

  const handleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setLiked(!liked);
  };

  /* ---------------------------
     🔸 Add Comment
  ---------------------------- */

  const handleAddComment = () => {
    if (newComment.trim() === "") return;

    setCommentList((prev) => [...prev, newComment]);
    setNewComment("");
  };

  return (
        <div
            className="relative group transition-all duration-300 hover:-translate-y-1 active:scale-[0.99]"
            onClick={() => {
                const now = Date.now();
                const DOUBLE_TAP_DELAY = 300;

                if (now - lastTap < DOUBLE_TAP_DELAY) {
                if (!liked) {
                    setLiked(true);
                    setLikeCount((prev) => prev + 1);
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

          <span className="text-xs text-white/40">
            {timestamp}
          </span>
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

        {/* Content */}
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          {content}
        </p>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-white/50">

          <span>
            {type === "lore" ? "Anonymous" : author}
          </span>

          <div className="flex items-center gap-6">

            {/* Like */}
            <button
            onClick={(e) => {
                e.stopPropagation(); // prevents triggering double tap
                handleLike();
            }}
            className={`flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 ${
                liked ? "text-pink-400" : "hover:text-white"
            }`}
            >
            <Heart
                size={16}
                strokeWidth={1.5}
                fill={liked ? "currentColor" : "none"}
            />
            <span>{likeCount}</span>
            </button>


            {/* Comment Toggle */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <MessageCircle size={16} strokeWidth={1.5} />
              <span>{commentList.length}</span>
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
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {commentList.map((comment, index) => (
                <div
                  key={index}
                  className="text-sm text-white/70 bg-white/5 px-3 py-2 rounded-lg"
                >
                  {comment}
                </div>
              ))}
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
