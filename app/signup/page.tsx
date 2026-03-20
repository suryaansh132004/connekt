"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { createUserWithEmailAndPassword, updateProfile as updateFirebaseProfile } from "firebase/auth";
import { useUserProfile } from "@/context/UserProfileContext";
import { Zap, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Stepper, { Step } from "@/components/animations/stepper/stepper";

export default function SignupPage() {
  const router = useRouter();
  const { updateProfile } = useUserProfile();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [handleError, setHandleError] = useState("");
  const [isValidatingHandle, setIsValidatingHandle] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [dept, setDept] = useState("");
  const [year, setYear] = useState("");

  // Clear error on change
  useEffect(() => {
    setError("");
    if (currentStep !== 3) setHandleError("");
  }, [email, password, name, handle, dept, year, currentStep]);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  // Debounced Handle Validation
  useEffect(() => {
    if (!handle.trim()) {
      setHandleError("");
      setIsValidatingHandle(false);
      return;
    }

    const cleanHandle = handle.trim().replace(/^@/, '');
    
    // Set validating state immediately
    setIsValidatingHandle(true);
    setHandleError("");

    const timeoutId = setTimeout(async () => {
      try {
        const { data, error: checkError } = await supabase
          .from('profiles')
          .select('handle')
          .eq('handle', cleanHandle);

        if (checkError) {
          console.error("Supabase Handle Check Error:", checkError);
          setHandleError("Failed to check username availability.");
        } else if (data && data.length > 0) {
          setHandleError(`Handle @${cleanHandle} is already taken.`);
        } else {
          setHandleError("");
        }
      } catch (err) {
        console.error("Validation error:", err);
      } finally {
        setIsValidatingHandle(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [handle]);

  const handleFinalStep = async () => {
    setLoading(true);
    setError("");

    const cleanHandle = handle.trim().replace(/^@/, '');

    try {
      // 1. Check if handle is already taken in Supabase
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('handle')
        .eq('handle', cleanHandle);

      if (checkError) {
        console.error("Supabase Handle Check Error:", checkError);
        setError(`Connection error: ${checkError.message}`);
        setLoading(false);
        return;
      }

      if (existingProfiles && existingProfiles.length > 0) {
        setError(`The handle @${cleanHandle} is already taken. Please pick another.`);
        setLoading(false);
        return;
      }

      // 2. Create firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 3. Update Firebase display name (optional but good for Firebase console)
      await updateFirebaseProfile(user, { displayName: name });

      // 4. Create profile in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.uid,
          handle: cleanHandle,
          display_name: name,
          dept: dept,
          year: year
        });

      if (profileError) {
        console.error("Supabase Profile Sync Error (Full):", profileError);
        setError(`Search Error: ${profileError.message || "Please check your Supabase table settings"}`);
        setLoading(false);
        return;
      }

      // 5. Update local UserProfileContext
      updateProfile({
        displayName: name,
        handle: cleanHandle,
        dept: dept,
        year: year,
        bio: "",
        skills: [],
        initials: name.charAt(0).toUpperCase() || "U",
      });

      // 6. Redirect to home
      router.replace("/");
    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This university ID is already registered. Try logging in instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.");
      } else {
        setError("Account creation failed. Please check your connection and try again.");
      }
      setLoading(false);
    }
  };

  // Validation logic
  let isNextDisabled = false;
  if (currentStep === 1) isNextDisabled = !email.trim() || !email.trim().endsWith("@learner.manipal.edu");
  if (currentStep === 2) isNextDisabled = !password.trim() || password.length < 6;
  if (currentStep === 3) isNextDisabled = !name.trim() || !handle.trim() || !!handleError || isValidatingHandle;
  if (currentStep === 4) isNextDisabled = !dept.trim() || !year.trim();

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
      <main className="relative z-10 w-full max-w-lg px-6">
        {/* Logo + title */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "linear-gradient(135deg, #7CFF8A, #4DEFFF)",
              boxShadow: "0 0 10px rgba(122,255,136,0.5), 0 0 20px rgba(122,255,136,0.3)",
            }}
          >
            <Zap size={32} fill="#12001F" color="#12001F" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Join CONNEKT
          </h1>
        </div>

        {/* Stepper Card */}
        <div
          className="relative overflow-hidden rounded-2xl flex flex-col"
          style={{
            background: "rgba(42, 15, 62, 0.4)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            minHeight: "450px"
          }}
        >
          {/* Top gradient line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: "linear-gradient(to right, transparent, rgba(122,255,136,0.8), transparent)",
            }}
          />

          {error && (
            <div className="px-6 pt-6 -mb-4 relative z-20">
              <p className="text-xs text-[#FF5C8A] bg-[#FF5C8A]/10 border border-[#FF5C8A]/20 rounded-xl px-4 py-2.5">
                {error}
              </p>
            </div>
          )}

          <Stepper
            initialStep={1}
            onStepChange={(step) => setCurrentStep(step)}
            onFinalStepCompleted={handleFinalStep}
            backButtonText="Back"
            nextButtonText="Next"
            nextButtonProps={{
              disabled: isNextDisabled || loading,
              style: (isNextDisabled || loading) ? { opacity: 0.5, cursor: "not-allowed" } : {},
            }}
            disableStepIndicators={true}
            stepCircleContainerClassName="!border-none !shadow-none !bg-transparent w-full"
            stepContainerClassName="!px-6 !pt-6 !pb-2"
            footerClassName="!px-6 !pb-6"
          >
            {/* Step 1: Email */}
            <Step>
              <h2 className="text-xl font-bold text-white mb-4">University Email</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2 uppercase tracking-wider ml-1 text-[#A090B0]">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@learner.manipal.edu"
                      className="block w-full px-4 py-3.5 rounded-xl text-white text-sm transition-all outline-none"
                      style={{ background: "#1A0B2E", border: "1px solid rgba(255,255,255,0.1)" }}
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
                  <p className="mt-2 text-[10px] text-[#6B5A7A] ml-1">Must be a valid @learner.manipal.edu address to join.</p>
                </div>
              </div>
            </Step>

            {/* Step 2: Password */}
            <Step>
              <h2 className="text-xl font-bold text-white mb-4">Secure your account</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2 uppercase tracking-wider ml-1 text-[#A090B0]">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full px-4 pr-12 py-3.5 rounded-xl text-white text-sm transition-all outline-none"
                      style={{ background: "#1A0B2E", border: "1px solid rgba(255,255,255,0.1)" }}
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
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#6B5A7A] hover:text-white transition-colors"
                        tabIndex={-1}
                    >
                        {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-[#6B5A7A] ml-1">At least 6 characters required.</p>
                </div>
              </div>
            </Step>

            {/* Step 3: Name & Handle */}
            <Step>
              <h2 className="text-xl font-bold text-white mb-4">Who are you?</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2 uppercase tracking-wider ml-1 text-[#A090B0]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. David Chen"
                    className="block w-full px-4 py-3.5 rounded-xl text-white text-sm transition-all outline-none"
                    style={{ background: "#1A0B2E", border: "1px solid rgba(255,255,255,0.1)" }}
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
                <div>
                  <label className="block text-xs font-medium mb-2 uppercase tracking-wider ml-1 text-[#A090B0]">
                    Username Handle
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#6B5A7A] pointer-events-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="david_chen"
                      className="block w-full pl-9 pr-4 py-3.5 rounded-xl text-white text-sm transition-all outline-none"
                      style={{ background: "#1A0B2E", border: "1px solid rgba(255,255,255,0.1)" }}
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
                  {/* Inline Handle Error */}
                  {handleError && (
                    <p className="mt-2 text-[10px] text-[#FF5C8A] ml-1 flex items-center gap-1 font-medium">
                      {handleError}
                    </p>
                  )}
                  {isValidatingHandle && (
                    <p className="mt-2 text-[10px] text-white/40 ml-1 flex items-center gap-1">
                      Checking availability...
                    </p>
                  )}
                </div>
              </div>
            </Step>

            {/* Step 4: Academics */}
            <Step>
              <h2 className="text-xl font-bold text-white mb-4">Academic Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2 uppercase tracking-wider ml-1 text-[#A090B0]">
                    Department
                  </label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="block w-full px-4 py-3.5 rounded-xl text-white text-sm transition-all outline-none appearance-none"
                    style={{ background: "#1A0B2E", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => {
                      e.target.style.border = "1px solid rgba(122,255,136,0.5)";
                      e.target.style.boxShadow = "0 0 0 2px rgba(122,255,136,0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <option value="" disabled>Select Department</option>
                    <option value="MIT">MIT (Manipal Institute of Technology)</option>
                    <option value="SMI">SMI (Srishti Manipal Institute)</option>
                    <option value="DLHS">DLHS (Dept of Liberal Arts)</option>
                    <option value="DOC">DOC (Dept of Commerce)</option>
                    <option value="MLS">MLS (Manipal Law School)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2 uppercase tracking-wider ml-1 text-[#A090B0]">
                    Year of Study
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="block w-full px-4 py-3.5 rounded-xl text-white text-sm transition-all outline-none appearance-none"
                    style={{ background: "#1A0B2E", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => {
                      e.target.style.border = "1px solid rgba(122,255,136,0.5)";
                      e.target.style.boxShadow = "0 0 0 2px rgba(122,255,136,0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <option value="" disabled>Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year / Senior">4th Year / Senior</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>
              </div>
            </Step>
          </Stepper>

          {/* Login Link */}
          <div className="p-4 text-center border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <p className="text-sm" style={{ color: "#A090B0" }}>
              Already registered?{" "}
              <Link href="/login" className="font-medium hover:underline transition-colors block mt-2" style={{ color: "#4DEFFF" }}>
                Sign in instead
              </Link>
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
