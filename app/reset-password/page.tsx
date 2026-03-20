"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset } from "firebase/auth";
import { Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get("oobCode"); // Firebase uses 'oobCode' for password resets

    const { toast } = useToast();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!oobCode) {
            toast("Invalid or expired reset link.", "error");
            return;
        }

        if (password.length < 6) {
             toast("Password must be at least 6 characters long.", "error");
             return;
        }

        if (password !== confirmPassword) {
            toast("Passwords do not match.", "error");
            return;
        }

        setLoading(true);
        try {
            await confirmPasswordReset(auth, oobCode, password);
            toast("Password successfully reset! You can now log in.", "success");
            router.push("/login");
        } catch (err: any) {
            console.error("Confirm Reset Error:", err);
            toast("Failed to reset password. The link may have expired.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div
            className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: "#12001F", fontFamily: "var(--font-display)" }}
        >
            {/* ── Linear Gradient Background ─────────────────────────────── */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    background: "linear-gradient(326deg, #080808 0%, #3a005c 100%)"
                }}
            />

            {/* ── Decorative corner icons ──────────────────────── */}
            <div className="fixed bottom-10 left-10 hidden md:block opacity-20">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
            </div>
            <div className="fixed top-20 right-20 hidden md:block opacity-10">
                <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#7CFF8A" strokeWidth="1">
                    <circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
            </div>

            {/* ── Main content ─────────────────────────────────── */}
            <main className="relative z-10 w-full max-w-md px-6">
                
                {/* Logo + title */}
                <div className="flex flex-col items-center mb-10">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                        style={{
                            background: "linear-gradient(135deg, #7CFF8A, #4DEFFF)",
                            boxShadow: "0 0 10px rgba(122,255,136,0.5), 0 0 20px rgba(122,255,136,0.3)",
                        }}
                    >
                        <Zap size={32} fill="#12001F" color="#12001F" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 text-center">
                        Secure Your Account
                    </h1>
                    <p style={{ color: "#A090B0" }} className="text-center text-sm">
                        Please enter your new password below.
                    </p>
                </div>

                {/* Glass card */}
                <form
                    onSubmit={handleSubmit}
                    className="relative overflow-hidden rounded-2xl p-8"
                    style={{
                        background: "rgba(42, 15, 62, 0.4)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                    }}
                >
                    {/* Top gradient line */}
                    <div
                        className="absolute top-0 left-0 right-0 h-px"
                        style={{
                            background: "linear-gradient(to right, transparent, rgba(122,255,136,0.8), transparent)",
                        }}
                    />

                    <div className="space-y-4">
                        {/* New Password */}
                        <div>
                            <label
                                className="block text-xs font-medium mb-2 uppercase tracking-wider ml-1"
                                style={{ color: "#A090B0" }}
                                htmlFor="password"
                            >
                                New Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B5A7A" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full pl-11 pr-4 py-3.5 rounded-xl text-white text-sm transition-all outline-none"
                                    style={{
                                        background: "#1A0B2E",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.border = "1px solid rgba(122,255,136,0.5)";
                                        e.target.style.boxShadow = "0 0 0 2px rgba(122,255,136,0.15)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label
                                className="block text-xs font-medium mb-2 uppercase tracking-wider ml-1 mt-2"
                                style={{ color: "#A090B0" }}
                                htmlFor="confirmPassword"
                            >
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B5A7A" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full pl-11 pr-4 py-3.5 rounded-xl text-white text-sm transition-all outline-none"
                                    style={{
                                        background: "#1A0B2E",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.border = "1px solid rgba(122,255,136,0.5)";
                                        e.target.style.boxShadow = "0 0 0 2px rgba(122,255,136,0.15)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password || !confirmPassword}
                            className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: loading ? "rgba(122,255,136,0.5)" : "#7CFF8A",
                                color: "#12001F",
                            }}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#12001F" strokeWidth="2.5">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                                    </svg>
                                    Updating...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
