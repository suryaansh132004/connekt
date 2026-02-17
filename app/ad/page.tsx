"use client";

import { useState } from "react";
import { useFeed } from "@/context/FeedContext";
import PostCard, { PostType, typeColors } from "@/components/feed/PostCard";
import { PlusCircle, Calendar, HelpCircle, BookOpen } from "lucide-react";

/* =========================================================
   🔹 Create Post Page
========================================================= */

export default function CreatePostPage() {
  const { addPost } = useFeed();

  /* ----------------------------
     🔸 State
  ----------------------------- */

  const [type, setType] = useState<PostType>("collab");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loreConfirmed, setLoreConfirmed] = useState(false);

  /* ----------------------------
     🔸 Tag Handling (FIXED)
  ----------------------------- */

  const handleTagsChange = (value: string) => {
    setTagsInput(value);

    const processed = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setTags(processed);
  };

  /* ----------------------------
     🔸 Submit
  ----------------------------- */

  const handleSubmit = () => {
    if (!title || !content) {
      alert("Title and content are required.");
      return;
    }

    if (type === "lore" && !loreConfirmed) {
      alert("You must confirm the lore guidelines.");
      return;
    }

    addPost({
      id: crypto.randomUUID(),
      type,
      title,
      content,
      author: type === "lore" ? "Anonymous" : "You",
      timestamp: Date.now(),
      tags,
      likes: 0,
    });

    setTitle("");
    setContent("");
    setTagsInput("");
    setTags([]);
    setLoreConfirmed(false);
  };

  /* ----------------------------
     🔸 Type Cards Config
  ----------------------------- */

  const typeOptions = [
    {
      value: "collab",
      label: "Collab",
      icon: <PlusCircle size={20} />,
      desc: "Find teammates & builders",
    },
    {
      value: "event",
      label: "Event",
      icon: <Calendar size={20} />,
      desc: "Promote workshops & meetups",
    },
    {
      value: "question",
      label: "Question",
      icon: <HelpCircle size={20} />,
      desc: "Ask for help or advice",
    },
    {
      value: "lore",
      label: "Lore",
      icon: <BookOpen size={20} />,
      desc: "Campus legends & stories",
    },
  ];

  /* =========================================================
     🔹 UI
  ========================================================= */

  return (
    <div className="min-h-screen pt-10 px-6 md:px-12 space-y-10">
      <h1 className="text-3xl font-bold">Create Post</h1>

      {/* TYPE SELECTOR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {typeOptions.map((option) => {
          const active = type === option.value;

          return (
            <button
              key={option.value}
              onClick={() => setType(option.value as PostType)}
              className={`p-4 rounded-2xl border transition-all duration-300 text-left ${
                active
                  ? "border-white/40 bg-white/10 shadow-lg"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div
                className="flex items-center gap-2 mb-2"
                style={{
                  color: typeColors[option.value as PostType],
                }}
              >
                {option.icon}
                <span className="font-medium">{option.label}</span>
              </div>

              <p className="text-xs text-white/50">{option.desc}</p>
            </button>
          );
        })}
      </div>

      {/* LORE WARNING */}
      {type === "lore" && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3">
          <p className="text-red-400 font-medium">Content Warning</p>
          <p className="text-sm text-white/60">
            Lore posts are anonymous but moderated. Do not mention real
            student names or spread harmful misinformation.
          </p>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={loreConfirmed}
              onChange={() => setLoreConfirmed(!loreConfirmed)}
              className="accent-red-500"
            />
            I understand harassment will result in a ban.
          </label>
        </div>
      )}

      {/* FORM */}
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm text-white/60">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
              className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-sm text-white/60">Story Body</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Write your post..."
              className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm text-white/60">
              Tags (comma separated)
            </label>
            <input
              value={tagsInput}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="React, AI, Campus..."
              className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            Publish Post
          </button>
        </div>

        {/* PREVIEW */}
        <div className="space-y-4">
          <h2 className="text-sm text-white/60">Live Preview</h2>

          <PostCard
            type={type}
            title={title || "Your title will appear here"}
            content={content || "Your content will appear here"}
            author={type === "lore" ? "Anonymous" : "You"}
            timestamp="Just now"
            tags={tags}
            likes={0}
          />
        </div>
      </div>
    </div>
  );
}
