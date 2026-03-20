"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

/* =========================================================
   🔹 Notification Types
========================================================= */

export type NotificationType = "like" | "comment" | "dm" | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
  actor?: {
    display_name: string;
    avatar_color: string;
  };
}

/* =========================================================
   🔹 Context Interface
========================================================= */

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          actor:profiles!actor_id(display_name, handle, avatar_color)
        `)
        .eq("recipient_id", user.uid)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Supabase Notification Error:", error);
        throw error;
      }

      const formatted: AppNotification[] = (data || []).map((n: any) => {
        let message = n.content || "";
        const actorName = n.actor?.display_name || "Someone";
        
        if (!message) {
          if (n.type === "like") message = `${actorName} liked your post`;
          if (n.type === "comment") message = `${actorName} commented on your post`;
          if (n.type === "message") message = `New message from ${actorName}`;
        }

        let link = "";
        if (n.type === "like" || n.type === "comment") link = `/post/${n.entity_id}`;
        if (n.type === "message") link = `/dms`;

        return {
          id: n.id,
          type: n.type === "message" ? "dm" : n.type,
          message,
          timestamp: new Date(n.created_at).getTime(),
          read: n.is_read,
          link,
          actor: n.actor
        };
      });

      setNotifications(formatted);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const channel = supabase
        .channel(`notifications:${user.uid}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.uid}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setNotifications([]);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", user.uid)
        .eq("is_read", false);

      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const clearAll = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("recipient_id", user.uid);

      if (error) throw error;
      setNotifications([]);
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return context;
}
