"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";

/* =========================================================
    🔹 Profile Type
========================================================= */

export interface UserProfile {
  displayName: string;
  handle: string;
  dept: string;
  year: string;
  bio: string;
  skills: string[];
  initials: string;
  avatarColor: string;
  github: string;
  portfolio: string;
  linkedin: string;
  notifications: {
    eventReminders: boolean;
    collabRequests: boolean;
    mentions: boolean;
  };
  privacy: {
    allowDMs: boolean;
    showOnlineStatus: boolean;
    publicProfile: boolean;
  };
  isVerified: boolean;
}

/* =========================================================
   🔹 Context Type
========================================================= */

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateNotifications: (patch: Partial<UserProfile["notifications"]>) => void;
  updatePrivacy: (patch: Partial<UserProfile["privacy"]>) => void;
}

/* =========================================================
   🔹 Defaults
========================================================= */

const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  handle: "",
  dept: "",
  year: "",
  bio: "",
  skills: [],
  initials: "U",
  avatarColor: "#4DEFFF",
  github: "",
  portfolio: "",
  linkedin: "",
  notifications: {
    eventReminders: true,
    collabRequests: true,
    mentions: false,
  },
  privacy: {
    allowDMs: false,
    showOnlineStatus: true,
    publicProfile: true,
  },
  isVerified: false,
};

const PROFILE_KEY = "connekt_profile";

/* =========================================================
   🔹 Context
========================================================= */

const UserProfileContext = createContext<UserProfileContextType | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // Sync with Supabase on Login
  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(DEFAULT_PROFILE);
        return;
      }

      try {
        // Try fetching from Supabase first (Source of Truth)
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.uid)
          .single();

        if (data) {
          const fetchedProfile: UserProfile = {
            ...DEFAULT_PROFILE,
            displayName: data.display_name || "",
            handle: data.handle || "",
            dept: data.dept || "",
            year: data.year || "",
            bio: data.bio || "",
            skills: data.skills || [],
            avatarColor: data.avatar_color || DEFAULT_PROFILE.avatarColor,
            github: data.github || "",
            portfolio: data.portfolio || "",
            linkedin: data.linkedin || "",
            notifications: data.notifications || DEFAULT_PROFILE.notifications,
            privacy: data.privacy || DEFAULT_PROFILE.privacy,
            initials: (data.display_name || "U").charAt(0).toUpperCase(),
            isVerified: data.is_verified || false,
          };
          setProfile(fetchedProfile);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(fetchedProfile));
        } else {
          // Fallback to localStorage if not in DB yet (e.g. legacy user or first-time sync)
          const stored = localStorage.getItem(PROFILE_KEY);
          if (stored) setProfile(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Profile Fetch Error:", err);
      }
    }

    fetchProfile();
  }, [user]);

  // Persist helper (Local + Supabase)
  const persist = async (updated: UserProfile) => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
      
      if (user) {
        // Update Supabase
        const { error } = await supabase
          .from("profiles")
          .update({
            display_name: updated.displayName,
            handle: updated.handle,
            dept: updated.dept,
            year: updated.year,
            bio: updated.bio,
            skills: updated.skills,
            avatar_color: updated.avatarColor,
            github: updated.github,
            portfolio: updated.portfolio,
            linkedin: updated.linkedin,
            notifications: updated.notifications,
            privacy: updated.privacy,
            is_verified: updated.isVerified,
          })
          .eq("id", user.uid);

        if (error) {
          console.error("Supabase Save Error:", error);
        } else {
          console.log("Profile successfully saved to Supabase");
        }
      }
    } catch (err) {
      console.error("Persistence Error:", err);
    }
  };

  const updateProfile = (patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  };

  const updateNotifications = (patch: Partial<UserProfile["notifications"]>) =>
    setProfile((prev) => {
      const next = {
        ...prev,
        notifications: { ...prev.notifications, ...patch },
      };
      persist(next);
      return next;
    });

  const updatePrivacy = (patch: Partial<UserProfile["privacy"]>) =>
    setProfile((prev) => {
      const next = {
        ...prev,
        privacy: { ...prev.privacy, ...patch },
      };
      persist(next);
      return next;
    });

  return (
    <UserProfileContext.Provider
      value={{ profile, updateProfile, updateNotifications, updatePrivacy }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

/* =========================================================
   🔹 Hook
========================================================= */

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx)
    throw new Error("useUserProfile must be used inside UserProfileProvider");
  return ctx;
}
