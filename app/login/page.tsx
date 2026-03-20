"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Zap, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const { login, isLoggedIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => setMounted(true), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Please enter your university email.");
            return;
        }
        if (!email.trim().endsWith("@learner.manipal.edu")) {
            setError("Please use your @learner.manipal.edu email.");
            return;
        }
        if (!password.trim()) {
            setError("Please enter your password.");
            return;
        }

        setLoading(true);
        try {
            await login(email.trim(), password);
            // Router redirect is handled inside login() in AuthContext
        } catch (err: any) {
            console.error("Login Error:", err);
            if (err.code === "auth/user-not-found") {
                setError("Account does not exist. Please sign up first.");
            } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
                setError("Incorrect email or password. Please try again.");
            } else if (err.code === "auth/too-many-requests") {
                setError("Too many failed attempts. Please try again later.");
            } else {
                setError("Login failed. Please check your connection.");
            }
            setLoading(false);
        }
    };

    if (!mounted || isLoggedIn) return null;

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
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                        CONNEKT
                    </h1>
                    <p style={{ color: "#A090B0" }} className="text-center text-sm">
                        Your Campus. After Dark.
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
                            background:
                                "linear-gradient(to right, transparent, rgba(122,255,136,0.8), transparent)",
                        }}
                    />

                    <h2 className="text-xl font-bold text-white mb-6 text-center">
                        University Login
                    </h2>

                    <div className="space-y-4">
                        {/* Email */}
                        <div>
                            <label
                                className="block text-xs font-medium mb-2 uppercase tracking-wider ml-1"
                                style={{ color: "#A090B0" }}
                                htmlFor="email"
                            >
                                University Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B5A7A" strokeWidth="2">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                                    </svg>
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="yourname@learner.manipal.edu"
                                    autoComplete="email"
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
                            <p className="mt-1.5 text-[10px] ml-1" style={{ color: "#6B5A7A" }}>
                                Must be a valid @learner.manipal.edu address to join.
                            </p>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2 ml-1">
                                <label
                                    className="block text-xs font-medium uppercase tracking-wider"
                                    style={{ color: "#A090B0" }}
                                    htmlFor="password"
                                >
                                    Password
                                </label>
                                <a 
                                    href="/forgot-password" 
                                    className="text-[10px] font-medium transition-colors"
                                    style={{ color: "#4DEFFF" }}
                                >
                                    Forgot Password?
                                </a>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B5A7A" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="block w-full pl-11 pr-12 py-3.5 rounded-xl text-white text-sm transition-all outline-none"
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
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#6B5A7A] hover:text-white transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-xs text-[#FF5C8A] bg-[#FF5C8A]/10 border border-[#FF5C8A]/20 rounded-xl px-4 py-2.5 text-center">
                                {error}
                            </p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group/btn mt-2"
                            style={{
                                background: loading ? "rgba(122,255,136,0.5)" : "#7CFF8A",
                                color: "#12001F",
                            }}
                            onMouseEnter={(e) => {
                                if (!loading)
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                                        "0 0 20px rgba(122,255,136,0.6)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                            }}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#12001F" strokeWidth="2.5">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                                    </svg>
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#12001F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer links */}
                <div className="mt-8 text-center space-y-4">
                    <p className="text-sm" style={{ color: "#A090B0" }}>
                        Don't have an account?{" "}
                        <a
                            href="/signup"
                            className="font-medium hover:underline transition-colors block mt-2"
                            style={{ color: "#4DEFFF" }}
                        >
                            Sign up instead
                        </a>
                    </p>
                    <div className="flex justify-center items-center gap-4 text-xs" style={{ color: "#6B5A7A" }}>
                        <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </main>
        </div>
    );
}
