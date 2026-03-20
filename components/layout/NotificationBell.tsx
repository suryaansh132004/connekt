"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Heart, MessageCircle, Info } from "lucide-react";
import { useNotifications, NotificationType } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "like": return <Heart size={16} className="text-pink-400" />;
      case "comment": return <MessageCircle size={16} className="text-[#4DEFFF]" />;
      case "system": return <Info size={16} className="text-[#FFD166]" />;
      default: return <Bell size={16} className="text-white/60" />;
    }
  };

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    setIsOpen(false);
    if (link) {
      router.push(link);
    }
  };

  function formatTime(timestamp: number) {
    const diffMins = Math.floor((now - timestamp) / (1000 * 60));
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  }

  return (
    <div className="relative z-50 flex items-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
      >
        <Bell size={20} className="text-white" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-[#12001F]"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-80 bg-[#1A0B2E] backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#7CFF8A] hover:text-white transition"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-white/40 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n.id, n.link)}
                    className={`p-4 hover:bg-white/5 transition cursor-pointer flex gap-3 ${
                      !n.read ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <div className="mt-1">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${!n.read ? "text-white font-medium" : "text-white/70"}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        {formatTime(n.timestamp)}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-[#7CFF8A] mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
