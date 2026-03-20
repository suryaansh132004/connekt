"use client";

import { useState } from "react";
import { useFeed } from "@/context/FeedContext";
import PostCard, { PostType, typeColors } from "@/components/feed/PostCard";
import { PlusCircle, Calendar, HelpCircle, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/* =========================================================
   🔹 Create Post Page
========================================================= */

export default function CreatePostPage() {
  const { addPost } = useFeed();
  const { user } = useAuth();

  /* ----------------------------
     🔸 State
  ----------------------------- */

  const [type, setType] = useState<PostType>("collab");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [isDeptSpecific, setIsDeptSpecific] = useState(false);
  const [targetDept, setTargetDept] = useState("MIT");
  const [loreConfirmed, setLoreConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    if (type === "lore" && !loreConfirmed) {
      setError("You must confirm the lore guidelines before posting.");
      return;
    }

    let finalContent = content;
    if (type === "event") {
      const metadata = [];
      if (eventDate) metadata.push(`📆 Date: ${eventDate}`);
      if (eventLocation) metadata.push(`📍 Location: ${eventLocation}`);
      if (metadata.length > 0) {
        finalContent = `${metadata.join("\n")}\n\n${content}`;
      }
    }

    addPost({
      id: crypto.randomUUID(),
      type,
      title,
      content: finalContent,
      author: type === "lore" ? "Anonymous" : "You",
      authorId: user?.uid || "",
      timestamp: Date.now(),
      tags,
      likes: 0,
      comments: [],
      targetDept: (type === "event" || type === "question") && isDeptSpecific ? targetDept : undefined,
    });

    setTitle("");
    setContent("");
    setTagsInput("");
    setTags([]);
    setEventDate("");
    setEventLocation("");
    setIsDeptSpecific(false);
    setTargetDept("MIT");
    setLoreConfirmed(false);
    setError("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
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
    <div className="min-h-screen pt-10 pb-28 px-6 md:px-12 space-y-10">
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

          {/* Event Metadata */}
          {type === "event" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/60">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white color-scheme-dark"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div>
                <label className="text-sm text-white/60">Location</label>
                <input
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g. EC Area"
                  className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                />
              </div>
            </div>
          )}

          {/* Department Targeting */}
          {(type === "event" || type === "question") && (
            <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="flex items-center gap-3 cursor-pointer text-sm text-white/80 select-none">
                <input
                  type="checkbox"
                  checked={isDeptSpecific}
                  onChange={(e) => setIsDeptSpecific(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 accent-[#7CFF8A]"
                />
                Is this {type} for a specific department only?
              </label>

              {isDeptSpecific && (
                <div className="mt-3 pl-7">
                  <label className="text-xs text-white/50 block mb-2 uppercase tracking-wider font-semibold">Select Target Department</label>
                  <select
                    value={targetDept}
                    onChange={(e) => setTargetDept(e.target.value)}
                    className="w-full bg-[#12001F] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#7CFF8A]/40 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22gray%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5H7z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-1rem)_center]"
                  >
                    <option value="MIT">MIT</option>
                    <option value="SMI">SMI</option>
                    <option value="DLHS">DLHS</option>
                    <option value="DOC">DOC</option>
                    <option value="MLS">MLS</option>
                  </select>
                </div>
              )}
            </div>
          )}

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

          {/* Error / success feedback */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          {submitted && (
            <div className="px-4 py-3 rounded-xl bg-[#7CFF8A]/10 border border-[#7CFF8A]/30 text-[#7CFF8A] text-sm">
              ✓ Post published to the feed!
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 transition font-medium"
          >
            Publish Post
          </button>
        </div>

        {/* PREVIEW */}
        <div className="space-y-4">
          <h2 className="text-sm text-white/60">Live Preview</h2>

          <PostCard
            id="preview"
            type={type}
            title={title || "Your title will appear here"}
            content={content || "Your content will appear here"}
            author={type === "lore" ? "Anonymous" : "You"}
            timestamp={Date.now()}
            tags={tags}
            likes={0}
          />
        </div>
      </div>
    </div>
  );
}
