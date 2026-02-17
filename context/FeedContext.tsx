"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PostType } from "@/components/feed/PostCard";

/* =========================================================
   🔹 Post Type Definition
========================================================= */

export interface Post {
  id: string;
  type: PostType;
  title: string;
  content: string;
  author: string;
  timestamp: number;
  tags: string[];
  likes: number;
}

/* =========================================================
   🔹 Context Type
========================================================= */

interface FeedContextType {
  posts: Post[];
  addPost: (post: Post) => void;
  likePost: (id: string) => void;
}

/* =========================================================
   🔹 Create Context
========================================================= */

const FeedContext = createContext<FeedContextType | null>(null);

/* =========================================================
   🔹 Provider
========================================================= */

export function FeedProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([
  {
    id: "post-1",
    type: "collab",
    title: "Seeking React Dev for AI Campus Guide",
    content:
      "Building a specialized LLM wrapper for campus resources.",
    author: "Aarav S.",
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2h ago
    tags: ["React", "Tailwind"],
    likes: 17,
  },
  {
    id: "post-2",
    type: "question",
    title: "Best DSA prep strategy?",
    content:
      "Struggling with graphs and DP. Any campus seniors with guidance?",
    author: "Megha P.",
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5h ago
    tags: ["DSA", "Placement"],
    likes: 69,
  },
  {
    id: "post-3",
    type: "event",
    title: "UI/UX Workshop This Saturday 🎨",
    content:
      "Student-led Figma + Design Systems workshop in AB5.",
    author: "Rahul K.",
    timestamp: Date.now() - 1000 * 60 * 60 * 6,
    tags: ["Design", "Workshop"],
    likes: 42,
  },
  {
    id: "post-4",
    type: "lore",
    title: "Library AC broke again 💀",
    content: "Midsem week chaos. Send help.",
    author: "Anonymous",
    timestamp: Date.now() - 1000 * 60 * 60 * 1,
    tags: ["Campus", "Midsems"],
    likes: 9,
  },
  {
    id: "post-5",
    type: "collab",
    title: "Looking for Flutter Dev for Hackathon",
    content:
      "24-hour build sprint. Need someone strong with animations.",
    author: "Divya M.",
    timestamp: Date.now() - 1000 * 60 * 60 * 3,
    tags: ["Flutter", "Hackathon"],
    likes: 28,
  },
  {
    id: "post-6",
    type: "event",
    title: "AI Club Meetup Tonight 🤖",
    content:
      "Discussing multi-agent systems and RAG pipelines.",
    author: "AI Society",
    timestamp: Date.now() - 1000 * 60 * 60 * 4,
    tags: ["AI", "LLM"],
    likes: 51,
  },
]);


  const addPost = (post: Post) => {
    setPosts((prev) => [post, ...prev]); // new posts on top
  };

  const likePost = (id: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, likes: post.likes + 1 } : post
      )
    );
  };

  return (
    <FeedContext.Provider value={{ posts, addPost, likePost }}>
      {children}
    </FeedContext.Provider>
  );
}

/* =========================================================
   🔹 Hook
========================================================= */

export function useFeed() {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error("useFeed must be used inside FeedProvider");
  }
  return context;
}
