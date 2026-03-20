"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { PostType } from "@/components/feed/PostCard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { useUserProfile } from "./UserProfileContext";

/* =========================================================
   🔹 Post Type Definition
========================================================= */

export interface Comment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  timestamp: string;
}

export interface Post {
  id: string;
  type: PostType;
  title: string;
  content: string;
  author: string;
  authorId: string;
  timestamp: number | string;
  tags: string[];
  likes: number;
  isLiked?: boolean;
  targetDept?: string;
  comments: Comment[];
}

/* =========================================================
   🔹 Context Type
========================================================= */

interface FeedContextType {
  posts: Post[];
  addPost: (post: Post) => void;
  likePost: (id: string) => void;
  addComment: (postId: string, comment: Comment) => void;
  deleteComment: (postId: string, commentId: string) => void;
  deletePost: (id: string) => void;
  editPost: (id: string, newContent: string) => void;
  deletePostsByAuthor: (authorName: string) => void;
  refreshPosts: () => Promise<void>;
}

/* =========================================================
   🔹 Create Context
========================================================= */

const FeedContext = createContext<FeedContextType | null>(null);

/* =========================================================
   🔹 Provider
========================================================= */

export function FeedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [posts, setPosts] = useState<Post[]>([]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles!author_id!inner(display_name, is_deactivated),
          comments(
            *,
            author:profiles!author_id(display_name, is_deactivated)
          ),
          post_likes(user_id)
        `)
        .eq("author.is_deactivated", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data) return;

      const formattedPosts: Post[] = data.map((p: any) => ({
        id: p.id,
        type: p.type as PostType,
        title: p.title,
        content: p.content,
        author: p.author?.display_name || "Unknown",
        authorId: p.author_id,
        timestamp: new Date(p.created_at).getTime(),
        tags: p.tags || [],
        likes: p.post_likes?.length || 0,
        isLiked: p.post_likes?.some((l: any) => (user ? l.user_id === user.uid : false)),
        targetDept: p.target_dept,
        comments: (p.comments || [])
          .filter((c: any) => !c.author?.is_deactivated)
          .map((c: any) => ({
            id: c.id,
            text: c.content,
            author: c.author?.display_name || "Unknown",
            authorId: c.author_id,
            timestamp: new Date(c.created_at).toLocaleDateString(),
          })),
      }));

      setPosts(formattedPosts);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Subscribe to changes
    const channel = supabase
      .channel("feed-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, (payload) => {
        fetchPosts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, (payload) => {
        fetchPosts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.uid]);

  const addPost = async (post: Post) => {
    if (!user) return;
    if (!user) return;
    if (!profile.isVerified) {
      alert("Please verify your email from Settings > Account to post.");
      return;
    }
    
    const { error } = await supabase.from("posts").insert({
      author_id: user.uid,
      type: post.type,
      title: post.title,
      content: post.content,
      tags: post.tags,
      target_dept: post.targetDept,
    });

    if (error) {
      console.error("Error adding post - Full Object:", error);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
    }
  };

  const likePost = async (id: string) => {
    if (!user) return;
    if (!user) return;
    if (!profile.isVerified) {
      alert("Please verify your email from Settings > Account to like posts.");
      return;
    }

    const post = posts.find((p) => p.id === id);
    if (!post) return;

    const isCurrentlyLiked = post.isLiked;
    const newLikedState = !isCurrentlyLiked;
    const newLikesCount = newLikedState ? post.likes + 1 : Math.max(0, post.likes - 1);

    // Optimistic Update
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isLiked: newLikedState, likes: newLikesCount } : p))
    );

    try {
      if (newLikedState) {
        // Add like
        const results = await Promise.all([
          supabase.from("post_likes").insert({ post_id: id, user_id: user.uid }),
          // Add notification if not liking own post
          ...(post.authorId !== user.uid ? [
            supabase.from("notifications").insert({
              recipient_id: post.authorId,
              actor_id: user.uid,
              type: "like",
              entity_id: id,
            })
          ] : [])
        ]);
        
        // Log notification error specifically if it failed
        if (post.authorId !== user.uid && (results[2] as any)?.error) {
          console.error("Error creating like notification:", (results[2] as any).error);
        }
      } else {
        // Remove like
        await Promise.all([
          supabase.from("post_likes").delete().match({ post_id: id, user_id: user.uid })
        ]);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Rollback
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isLiked: isCurrentlyLiked, likes: post.likes } : p))
      );
    }
  };

  const addComment = async (postId: string, comment: Comment) => {
    if (!user) return;
    if (!user) return;
    if (!profile.isVerified) {
      alert("Please verify your email from Settings > Account to comment.");
      return;
    }

    // Optimistic Update
    const tempId = crypto.randomUUID();
    const tempComment: Comment = {
      ...comment,
      id: tempId,
      author: comment.author || "You",
      authorId: user.uid,
      timestamp: "Just now",
    };

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, tempComment] } : p
      )
    );

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: user.uid,
      content: comment.text,
    });

    if (!error) {
      // Add notification if not commenting on own post
      const post = posts.find(p => p.id === postId);
      if (post && post.authorId !== user.uid) {
        const { error: notifError } = await supabase.from("notifications").insert({
          recipient_id: post.authorId,
          actor_id: user.uid,
          type: "comment",
          entity_id: postId,
          content: comment.text,
        });
        if (notifError) console.error("Error creating comment notification:", notifError);
      }
    }

    if (error) {
      console.error("Error adding comment:", error);
      // Rollback
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: p.comments.filter((c) => c.id !== tempId) }
            : p
        )
      );
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    // Optimistic Update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
          : p
      )
    );

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      // We don't easily rollback here without deep клонирование or refetching,
      // but the real-time subscription will eventually fix it if it fails.
      fetchPosts();
    }
  };

  const deletePost = async (id: string) => {
    // Optimistic Update
    const originalPosts = [...posts];
    setPosts((prev) => prev.filter((p) => p.id !== id));

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting post:", error);
      // Rollback
      setPosts(originalPosts);
    }
  };

  const editPost = async (id: string, newContent: string) => {
    // Optimistic Update
    const originalPosts = [...posts];
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, content: newContent } : p))
    );

    const { error } = await supabase
      .from("posts")
      .update({ content: newContent })
      .eq("id", id);

    if (error) {
      console.error("Error editing post:", error);
      // Rollback
      setPosts(originalPosts);
    }
  };

  const deletePostsByAuthor = async (authorName: string) => {
     // This is tricky without author_id, but we generally delete by current user's ID
     if (!user) return;

     // Optimistic Update
     const originalPosts = [...posts];
     setPosts((prev) => prev.filter((p) => p.authorId !== user.uid));

     const { error } = await supabase
       .from("posts")
       .delete()
       .eq("author_id", user.uid);
       
     if (error) {
       console.error("Error deleting user posts:", error);
       // Rollback
       setPosts(originalPosts);
     }
  };

  return (
    <FeedContext.Provider
      value={{
        posts,
        addPost,
        likePost,
        addComment,
        deleteComment,
        deletePost,
        editPost,
        deletePostsByAuthor,
        refreshPosts: fetchPosts,
      }}
    >
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
