/* =========================================================
    GLOBAL LAYOUT (SERVER COMPONENT)
   ========================================================= */

import "./globals.css"
import { ReactNode } from "react"
import { Space_Grotesk } from "next/font/google"
import GlowBackground from "../components/layout/GlowBackground"
import BottomNav from "../components/layout/BottomNav"
import { FeedProvider } from "@/context/FeedContext"
import { UserProfileProvider } from "@/context/UserProfileContext"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
})

export const metadata = {
  title: "CONNEKT",
  description: "Campus Collaboration Platform",
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} bg-[#12001F] text-white min-h-screen relative overflow-x-hidden`}
      >
        <UserProfileProvider>
          <FeedProvider>
            <GlowBackground />
            {children}
            <BottomNav />
          </FeedProvider>
        </UserProfileProvider>
      </body>
    </html>
  )
}
