"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUserProfile } from "@/context/UserProfileContext";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  User,
  Bell,
  ShieldCheck,
  AlertTriangle,
  Save,
  Plus,
  X,
  Check,
  Mail,
} from "lucide-react";
import { sendEmailVerification, reload } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";

/* =========================================================
   🔹 Toggle
========================================================= */

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none ${
        checked ? "bg-[#7CFF8A]" : "bg-white/10"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* =========================================================
   🔹 Section wrapper
========================================================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/5 p-6 space-y-5">
      <h2 className="text-base font-bold text-white border-b border-white/8 pb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

/* =========================================================
   🔹 Field
========================================================= */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/60">{label}</label>
      {children}
      {hint && <p className="text-xs text-white/30">{hint}</p>}
    </div>
  );
}

/* =========================================================
   🔹 Input styles
========================================================= */

const inputCls =
  "w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#7CFF8A]/50 transition-colors";

/* =========================================================
   🔹 Tabs
========================================================= */

type Tab = "profile" | "notifications" | "privacy" | "account";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User size={16} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  { id: "privacy", label: "Privacy", icon: <ShieldCheck size={16} /> },
  { id: "account", label: "Account", icon: <AlertTriangle size={16} /> },
];

/* =========================================================
   🔹 Inner page (needs Suspense for useSearchParams)
========================================================= */

function SettingsContent() {
  const { profile, updateProfile, updateNotifications, updatePrivacy } =
    useUserProfile();
  const { user, deleteAccount, deactivateAccount } = useAuth();
  const searchParams = useSearchParams();

  /* ----------------------------
     🔸 Active tab (from URL or default)
  ----------------------------- */

  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) ?? "profile"
  );

  // Sync if URL param changes
  useEffect(() => {
    const t = searchParams.get("tab") as Tab;
    if (t) setActiveTab(t);
  }, [searchParams]);

  /* ----------------------------
     🔸 Local draft state for profile edits
  ----------------------------- */

  const [draft, setDraft] = useState({
    displayName: profile.displayName,
    handle: profile.handle,
    dept: profile.dept,
    year: profile.year,
    bio: profile.bio,
    github: profile.github,
    linkedin: profile.linkedin,
    portfolio: profile.portfolio,
    avatarColor: profile.avatarColor,
  });
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [newSkill, setNewSkill] = useState("");
  const [saved, setSaved] = useState(false);

  // Account Actions State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Email Verification
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySent, setVerifySent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(profile.isVerified);

  // Sync state with profile object whenever it changes
  useEffect(() => {
    setIsEmailVerified(profile.isVerified);
  }, [profile.isVerified]);

  // Poll Firebase in background to detect when user clicks the link
  useEffect(() => {
    if (isEmailVerified || !user) return; // already verified or no user, no need to poll
    
    console.log("Starting verification polling for:", user.email);
    
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        console.log("Polling result - emailVerified:", auth.currentUser.emailVerified);
        if (auth.currentUser.emailVerified) {
          setIsEmailVerified(true);
          
          // 🔹 SYNC TO SUPABASE & UPDATE PROFILE CONTEXT
          updateProfile({ isVerified: true });
            
          clearInterval(interval);
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isEmailVerified, user]);

  const patch = (k: keyof typeof draft, v: string) =>
    setDraft((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    // 1. Normalize URLs (ensuring https:// if missing)
    const normalizeUrl = (u: string) => {
      if (!u || u.trim() === "") return "";
      const trimmed = u.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }
      return `https://${trimmed}`;
    };

    const sanitizedDraft = {
      ...draft,
      github: normalizeUrl(draft.github),
      linkedin: normalizeUrl(draft.linkedin),
      portfolio: normalizeUrl(draft.portfolio),
    };

    // Update local state so UI reflects sanitized URLs
    setDraft(sanitizedDraft);

    // Derive initials from name
    const parts = sanitizedDraft.displayName.trim().split(" ");
    const initials = parts
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");

    updateProfile({ ...sanitizedDraft, skills, initials });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) setSkills((p) => [...p, s]);
    setNewSkill("");
  };

  const AVATAR_COLORS = ["#4DEFFF", "#7CFF8A", "#FF5C8A", "#FFD166", "#a78bfa"];

  /* ----------------------------
     🔸 Email Verification
  ----------------------------- */

  const handleVerify = async () => {
    if (!auth.currentUser) return;
    setVerifyLoading(true);
    setVerifyError(null);
    setVerifySent(false);

    try {
      await sendEmailVerification(auth.currentUser);
      setVerifySent(true);
    } catch (error: any) {
      console.error("Verification email error:", error);
      if (error.code === "auth/too-many-requests") {
        setVerifyError("Too many requests. Please wait a few minutes and try again.");
      } else {
        setVerifyError(error.message || "Failed to send verification email.");
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await deactivateAccount();
    } catch (err: any) {
      setActionError(err.message || "Failed to deactivate account.");
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmEmail !== user?.email) {
      setActionError("Email does not match.");
      return;
    }
    if (!deletePassword) {
      setActionError("Password is required to delete account.");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      await deleteAccount(deleteConfirmEmail, deletePassword);
    } catch (err: any) {
      setActionError(err.message || "Failed to delete account. You may need to re-log in to confirm identity.");
      setActionLoading(false);
    }
  };


  /* =========================================================
     🔹 UI
  ========================================================= */

  return (
    <div className="min-h-screen pb-28 max-w-[680px] mx-auto pt-8 px-2">

      {/* Header */}
      <header className="flex items-center gap-3 mb-8">
        <Link
          href="/profile"
          className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white flex-1">Settings</h1>
      </header>

      {/* Tab Pills */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                active
                  ? "bg-[#7CFF8A]/10 border border-[#7CFF8A]/30 text-[#7CFF8A]"
                  : "bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-white/8"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── PROFILE TAB ─────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-5">
          {/* Avatar colour picker */}
          <Section title="Avatar">
            <div className="flex items-center gap-5">
              {/* Preview */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl shrink-0"
                style={{
                  background: `${draft.avatarColor}20`,
                  border: `3px solid ${draft.avatarColor}60`,
                  color: draft.avatarColor,
                  boxShadow: `0 0 20px ${draft.avatarColor}30`,
                }}
              >
                {draft.displayName
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("")}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-white/40">Choose accent colour</p>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => patch("avatarColor", c)}
                      className="w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-95"
                      style={{
                        background: c,
                        boxShadow:
                          draft.avatarColor === c ? `0 0 12px ${c}` : "none",
                        outline:
                          draft.avatarColor === c
                            ? `2px solid ${c}`
                            : "2px solid transparent",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-white/20">
                  Profile photo upload coming in v2
                </p>
              </div>
            </div>
          </Section>

          {/* Basic info */}
          <Section title="Basic Info">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Display Name">
                <input
                  className={inputCls}
                  value={draft.displayName}
                  onChange={(e) => patch("displayName", e.target.value)}
                  placeholder="Your name"
                />
              </Field>
              <Field label="Handle" hint="lowercase, no spaces">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                    @
                  </span>
                  <input
                    className={`${inputCls} pl-7`}
                    value={draft.handle}
                    onChange={(e) =>
                      patch("handle", e.target.value.toLowerCase().replace(/\s+/g, "_"))
                    }
                    placeholder="your_handle"
                  />
                </div>
              </Field>
              <Field label="Department / Branch">
                <input
                  className={inputCls}
                  value={draft.dept}
                  onChange={(e) => patch("dept", e.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </Field>
              <Field label="Year">
                <select
                  className={`${inputCls} appearance-none`}
                  value={draft.year}
                  onChange={(e) => patch("year", e.target.value)}
                >
                  {["1st Year", "2nd Year", "3rd Year", "4th Year", "Post-grad"].map(
                    (y) => (
                      <option key={y} value={y} className="bg-[#1a0030]">
                        {y}
                      </option>
                    )
                  )}
                </select>
              </Field>
            </div>
          </Section>

          {/* Bio */}
          <Section title="Bio">
            <Field label="About You" hint={`${draft.bio.length}/200 characters`}>
              <textarea
                className={`${inputCls} resize-none`}
                rows={4}
                maxLength={200}
                value={draft.bio}
                onChange={(e) => patch("bio", e.target.value)}
                placeholder="Tell your campus what you're about..."
              />
            </Field>
          </Section>

          {/* Skills */}
          <Section title="Skills & Tags">
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70"
                >
                  {skill}
                  <button
                    onClick={() =>
                      setSkills((p) => p.filter((s) => s !== skill))
                    }
                    className="text-white/30 hover:text-[#FF5C8A] transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                placeholder="Add a skill (press Enter)"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <Plus size={16} className="text-white/60" />
              </button>
            </div>
          </Section>

          {/* Links */}
          <Section title="Links">
            <Field label="GitHub URL">
              <input
                className={inputCls}
                value={draft.github}
                onChange={(e) => patch("github", e.target.value)}
                placeholder="https://github.com/yourname"
              />
            </Field>
            <Field label="LinkedIn URL">
              <input
                className={inputCls}
                value={draft.linkedin}
                onChange={(e) => patch("linkedin", e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
              />
            </Field>
            <Field label="Portfolio / Website">
              <input
                className={inputCls}
                value={draft.portfolio}
                onChange={(e) => patch("portfolio", e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </Field>
          </Section>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
              saved
                ? "bg-[#7CFF8A]/20 border border-[#7CFF8A]/40 text-[#7CFF8A]"
                : "bg-[#7CFF8A] text-[#12001F] hover:shadow-[0_0_20px_rgba(122,255,136,0.4)] hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            {saved ? (
              <>
                <Check size={16} /> Saved!
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      )}

      {/* ─── NOTIFICATIONS TAB ───────────────────────── */}
      {activeTab === "notifications" && (
        <Section title="Notifications">
          {(
            [
              {
                key: "eventReminders" as const,
                label: "Event Reminders",
                sub: "Get alerts 1h before an event starts",
              },
              {
                key: "collabRequests" as const,
                label: "Collab Requests",
                sub: "When someone wants to join your project",
              },
              {
                key: "mentions" as const,
                label: "Mentions",
                sub: "When you are tagged in a comment",
              },
            ] as const
          ).map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{item.sub}</p>
              </div>
              <Toggle
                checked={profile.notifications[item.key]}
                onChange={(v) => updateNotifications({ [item.key]: v })}
              />
            </div>
          ))}
        </Section>
      )}

      {/* ─── PRIVACY TAB ─────────────────────────────── */}
      {activeTab === "privacy" && (
        <Section title="Privacy">
          {(
            [
              {
                key: "allowDMs" as const,
                label: "Direct Messages",
                sub: "Allow DMs from everyone",
              },
              {
                key: "showOnlineStatus" as const,
                label: "Online Status",
                sub: "Show when you are active",
              },
              {
                key: "publicProfile" as const,
                label: "Profile Visibility",
                sub: "Visible in public search",
              },
            ] as const
          ).map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{item.sub}</p>
              </div>
              <Toggle
                checked={profile.privacy[item.key]}
                onChange={(v) => updatePrivacy({ [item.key]: v })}
              />
            </div>
          ))}
        </Section>
      )}

      {/* ─── ACCOUNT TAB ─────────────────────────────── */}
      {activeTab === "account" && (
        <div className="space-y-5">
          {/* Learner Verification Section */}
          <Section title="Learner Verification">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    Email Verification Status
                    {profile.isVerified ? (
                       <span className="px-2 py-0.5 rounded-full bg-[#7CFF8A]/20 text-[#7CFF8A] text-xs flex items-center gap-1 border border-[#7CFF8A]/30">
                          <Check size={12}/> Verified
                       </span>
                    ) : (
                       <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs border border-amber-500/30">
                          Unverified
                       </span>
                    )}
                  </p>
                  <p className="text-xs text-white/40 mt-1 max-w-sm">
                    {profile.isVerified
                      ? `Your account is verified — all features are unlocked!`
                      : `Verify ${user?.email ?? "your email"} to unlock posting, liking, and messaging.`}
                  </p>
                </div>
                {!profile.isVerified && (
                  <button
                    onClick={handleVerify}
                    disabled={verifyLoading || verifySent}
                    className="px-4 py-2 rounded-xl bg-[#7CFF8A] text-[#12001F] font-semibold text-sm hover:shadow-[0_0_20px_rgba(122,255,136,0.4)] transition-all shrink-0 disabled:opacity-60 flex items-center gap-2"
                  >
                    {verifyLoading ? "Sending..." : verifySent ? (
                      <><Check size={16}/> Email Sent</>
                    ) : (
                      <><Mail size={16}/> Send Verification Email</>
                    )}
                  </button>
                )}
              </div>
              {verifySent && !profile.isVerified && (
                <div className="text-xs text-[#7CFF8A] bg-[#7CFF8A]/5 p-3 rounded-xl border border-[#7CFF8A]/20 flex items-start gap-2">
                  <Check size={14} className="shrink-0 mt-0.5"/>
                  <span>Verification email sent to <strong>{user?.email}</strong>. Click the link in your inbox — the page will unlock automatically once verified.</span>
                </div>
              )}
              {verifyError && (
                 <div className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                   {verifyError}
                 </div>
              )}
            </div>
          </Section>

          <Section title="Account">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm font-medium text-white">
                  Deactivate Account
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  Hide your profile and activity temporarily.
                </p>
              </div>
              <button 
                onClick={() => setIsDeactivateModalOpen(true)}
                className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-sm font-medium shrink-0"
              >
                Deactivate
              </button>
            </div>
          </Section>

          {/* Report Bug Section */}
          <Section title="Report a Bug">
            <div className="space-y-4">
              <p className="text-xs text-white/40">
                Found something broken? Let us know and we'll fix it as soon as possible.
              </p>
              <div className="space-y-3">
                <textarea
                  id="bug-report"
                  className={`${inputCls} min-h-[100px] resize-none`}
                  placeholder="Describe the issue in detail..."
                />
                <button 
                  onClick={() => {
                    const msg = (document.getElementById("bug-report") as HTMLTextAreaElement)?.value;
                    if (!msg) return;
                    window.location.href = `mailto:suryaanshguleria541@gmail.com?subject=Connekt Bug Report&body=${encodeURIComponent(msg)}`;
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all active:scale-[0.98]"
                >
                  Send Bug Report
                </button>
              </div>
            </div>
          </Section>
          <div className="border border-red-500/20 rounded-2xl p-5 bg-red-500/5">
            <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider mb-4">
              Danger Zone
            </h3>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm font-medium text-white">Delete Account</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Permanently remove your account and all data. This cannot be
                  undone.
                </p>
              </div>
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-sm font-medium shrink-0"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DEACTIVATE MODAL ────────────────────────── */}
      {isDeactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !actionLoading && setIsDeactivateModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#12001F] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-2">Deactivate Account?</h2>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              Your profile, posts, and comments will be hidden until you log back in. You can re-activate your account anytime by signing in.
            </p>
            
            {actionError && (
              <div className="mb-4 text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-xl">
                {actionError}
              </div>
            )}

            <div className="flex gap-3">
              <button 
                disabled={actionLoading}
                onClick={() => setIsDeactivateModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={actionLoading}
                onClick={handleDeactivate}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE MODAL ────────────────────────────── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !actionLoading && setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#12001F] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Delete Account Permanently?</h2>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              This action <span className="text-white font-bold">cannot be undone</span>. All your posts, comments, and profile data will be permanently removed.
            </p>

            <div className="space-y-4 mb-6">
              <Field label={`Type "${user?.email}" to confirm`}>
                <input 
                  className={inputCls}
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  placeholder={user?.email || ""}
                />
              </Field>
              <Field label="Enter Password">
                <input 
                  type="password"
                  className={inputCls}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Password"
                />
              </Field>
            </div>

            {actionError && (
              <div className="mb-4 text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-xl">
                {actionError}
              </div>
            )}

            <div className="flex gap-3">
              <button 
                disabled={actionLoading}
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={actionLoading}
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🔹 Default export — Suspense wrapper required by Next.js
       App Router for useSearchParams()
========================================================= */

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
