"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFeed } from "@/context/FeedContext";
import PostCard from "@/components/feed/PostCard";
import { ArrowLeft } from "lucide-react";

export default function SinglePostPage() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract post ID from URL
  const postId = pathname.split("/").pop() || "";
  
  const { posts } = useFeed();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="min-h-screen pt-12 pb-32 flex flex-col items-center justify-center space-y-4 max-w-[600px] mx-auto">
        <h1 className="text-2xl font-bold text-white">Post Not Found</h1>
        <p className="text-white/40">This post may have been deleted.</p>
        <button 
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-32 max-w-[600px] mx-auto space-y-6">
      <header className="sticky top-0 z-40 pb-2 bg-[#080808] flex items-center gap-3 pt-2">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-white flex-1">
          Post
        </h1>
      </header>
      
      <div className="fade-in">
        <PostCard
          id={post.id}
          type={post.type}
          title={post.title}
          content={post.content}
          author={post.author}
          timestamp={post.timestamp as number}
          tags={post.tags}
          likes={post.likes}
          comments={post.comments}
          targetDept={post.targetDept}
        />
      </div>
    </div>
  );
}
