"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

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
  avatarColor: string;   // hex for the avatar ring / bg tint
  github: string;
  portfolio: string;
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
  displayName: "David Chen",
  handle: "david_chen",
  dept: "Computer Science",
  year: "2nd Year",
  bio: "Night owl coder 🦉 looking for hackathon teammates. Currently obsessed with generative art and retro game dev.",
  skills: ["Python", "React", "UI Design"],
  initials: "DC",
  avatarColor: "#4DEFFF",
  github: "",
  portfolio: "",
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
};

/* =========================================================
   🔹 Context
========================================================= */

const UserProfileContext = createContext<UserProfileContextType | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const updateProfile = (patch: Partial<UserProfile>) =>
    setProfile((prev) => ({ ...prev, ...patch }));

  const updateNotifications = (
    patch: Partial<UserProfile["notifications"]>
  ) =>
    setProfile((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...patch },
    }));

  const updatePrivacy = (patch: Partial<UserProfile["privacy"]>) =>
    setProfile((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, ...patch },
    }));

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
