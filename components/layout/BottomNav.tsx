"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, MessageCircle, Search, User } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";


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
  const [indicatorStyle, setIndicatorStyle] = useState({
  left: 0,
  width: 40,
  });


  useLayoutEffect(() => {
    const activeIndex = navItems.findIndex(
      (item) => item.href === pathname
    );

    const activeItem = itemRefs.current[activeIndex];

    if (activeItem && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      const left = itemRect.left - containerRect.left + itemRect.width / 2 - 20;

      setIndicatorStyle({
        left,
        width: 40,
      });
    }
  }, [pathname]);

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center">
      <div
        ref={containerRef}
        className="relative flex justify-between items-center w-[90%] max-w-md px-10 py-4 rounded-full 
            bg-white/3 backdrop-blur-md
            border border-white/5 
            shadow-[0_8px_40px_rgba(0,0,0,0.25)]"

      >
        {/* Sliding Indicator */}
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
  );
}
