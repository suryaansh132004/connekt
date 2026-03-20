"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GlowBackground from "@/components/layout/GlowBackground";
import StaggeredMenu from "@/components/animations/menu/menu";
import NotificationBell from "@/components/layout/NotificationBell";
import PageTransition from "@/components/layout/PageTransition";

const menuItems = [
  { label: "HOME", ariaLabel: "Home feed", link: "/" },
  { label: "DMs", ariaLabel: "Direct messages", link: "/dms" },
  { label: "POST", ariaLabel: "Create a post", link: "/ad" },
  { label: "SEARCH", ariaLabel: "Discover", link: "/search" },
  { label: "PROFILE", ariaLabel: "Your profile", link: "/profile" },
];

const socialItems = [
  { label: "Instagram", link: "https://www.instagram.com/suryaanshg_" },
  { label: "LinkedIn", link: "https://www.linkedin.com/in/suryaanshguleria" },
  { label: "GitHub", link: "https://github.com/suryaansh132004" },
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login";
  const isSignupPage = pathname === "/signup";
  const isForgotPage = pathname === "/forgot-password";
  const isResetPage = pathname === "/reset-password";
  const isPublicAuthPage = isLoginPage || isSignupPage || isForgotPage || isResetPage;

  useEffect(() => {
    if (loading) return;

    // If NOT logged in and trying to go anywhere besides public auth pages
    if (!isLoggedIn && !isPublicAuthPage) {
      router.replace("/login");
    }
    // If logged in and trying to go to login/signup/etc.
    if (isLoggedIn && isPublicAuthPage) {
      router.replace("/");
    }
  }, [isLoggedIn, isPublicAuthPage, loading, router]);

  // Don't render until we know the auth status
  if (loading) return null;

  // Login/Signup page: render standalone (no shell)
  if (isPublicAuthPage) {
    if (isLoggedIn) return null; // redirecting away
    return <PageTransition>{children}</PageTransition>;
  }

  // Protected pages: block until authenticated
  if (!isLoggedIn) return null;

  // Authenticated app shell with nav + glow
  return (
    <>
      <GlowBackground />
      <div className="px-4">
        <PageTransition>{children}</PageTransition>
      </div>
      <StaggeredMenu
        headerContent={<NotificationBell />}
        position="right"
        items={menuItems}
        socialItems={socialItems}
        displaySocials
        displayItemNumbering={true}
        menuButtonColor="#ffffff"
        openMenuButtonColor="#ffffff"
        changeMenuColorOnOpen={false}
        colors={["#1c0338", "#4e0573", "#a4508b"]}
        logoUrl=""
        accentColor="#7CFF8A"
        isFixed={true}
      />
    </>
  );
}
