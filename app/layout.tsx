import "./globals.css"
import { ReactNode } from "react"
import { Space_Grotesk } from "next/font/google"
import { FeedProvider } from "@/context/FeedContext"
import { UserProfileProvider } from "@/context/UserProfileContext"
import { AuthProvider } from "@/context/AuthContext"
import { NotificationProvider } from "@/context/NotificationContext"
import { ChatProvider } from "@/context/ChatContext"
import AuthGuard from "@/components/AuthGuard"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
})

import { ToastProvider } from "@/context/ToastContext"

export const metadata = {
  title: "CONNEKT | Campus Collaboration Platform",
  description: "Connect, collaborate, and share with your campus community. Join groups, find projects, and stay updated with your department.",
  openGraph: {
    title: "CONNEKT",
    description: "Campus Collaboration Platform",
    url: "https://connekt.app",
    siteName: "CONNEKT",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CONNEKT",
    description: "Campus Collaboration Platform",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} text-white min-h-screen relative overflow-x-hidden`}
      >
        <ToastProvider>
          <AuthProvider>
            <UserProfileProvider>
              <FeedProvider>
                <NotificationProvider>
                  <ChatProvider>
                    <AuthGuard>
                      {children}
                    </AuthGuard>
                  </ChatProvider>
                </NotificationProvider>
              </FeedProvider>
            </UserProfileProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
