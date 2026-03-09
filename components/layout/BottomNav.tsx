"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, MessageCircle, Search, User } from "lucide-react";
import { useLayoutEffect, useRef, useState, useEffect, useCallback } from "react";

const navItems = [
  { href: "/", icon: Home },
  { href: "/dms", icon: MessageCircle },
  { href: "/ad", icon: PlusCircle },
  { href: "/search", icon: Search },
  { href: "/profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 40 });
  const isDms = pathname === "/dms";
  const [visible, setVisible] = useState(true);

  /* ----------------------------
     🔸 Indicator position
  ----------------------------- */

  useLayoutEffect(() => {
    const activeIndex = navItems.findIndex((item) => item.href === pathname);
    const activeItem = itemRefs.current[activeIndex];

    if (activeItem && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const left = itemRect.left - containerRect.left + itemRect.width / 2 - 20;
      setIndicatorStyle({ left, width: 40 });
    }
  }, [pathname]);

  /* ----------------------------
     🔸 Auto-hide logic (1s delay)
  ----------------------------- */

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 1000);
  }, []);

  const showNav = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
  }, []);

  // Show on every mount/route change; auto-hide only when on /dms
  useEffect(() => {
    showNav();
    if (pathname === "/dms") scheduleHide();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname, showNav, scheduleHide]);

  return (
    <>
      {/* ── Hint bar + trigger zone (DMs only) ────────── */}
      {isDms && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center pb-2 pt-6"
          onMouseEnter={showNav}
          onTouchStart={showNav}
        >
          <div
            className={`
              w-[90%] max-w-md h-1 rounded-full transition-all duration-500
              ${visible ? "opacity-0 scale-x-75" : "opacity-100 scale-x-100"}
            `}
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)",
            }}
          />
        </div>
      )}

      {/* ── Nav pill ────────────────────────────────────── */}
      <div
        className={`
          fixed bottom-6 left-0 right-0 z-50 flex justify-center
          transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${visible ? "translate-y-0" : "translate-y-[calc(100%+1.5rem)]"}
        `}
        onMouseEnter={showNav}
        onMouseLeave={isDms ? scheduleHide : undefined}
        onTouchStart={showNav}
      >
        <div
          ref={containerRef}
          className="relative flex justify-between items-center w-[90%] max-w-md px-10 py-4 rounded-full
            bg-white/3 backdrop-blur-md
            border border-white/5
            shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
        >
          {/* Sliding active indicator */}
          <div
            className="absolute bottom-2 h-1 rounded-full transition-all duration-300 ease-in-out"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              backgroundColor: "#7CFF8A",
              boxShadow: "0 -8px 25px rgba(124,255,138,0.7)",
            }}
          />

          {navItems.map(({ href, icon: Icon }, index) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className="relative flex items-center justify-center w-10"
              >
                <Icon
                  size={26}
                  className={`transition-all duration-300 ${
                    active
                      ? "text-[#7CFF8A] scale-110"
                      : "text-white/60 hover:text-white"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
