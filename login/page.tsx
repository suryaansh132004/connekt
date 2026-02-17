"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Mail, Sparkles } from "lucide-react"

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const isValidUniversityEmail = (email: string) => {
    return email.endsWith(".edu") // you can expand this later
  }

  const handleLogin = async () => {
    if (!isValidUniversityEmail(email)) {
      setMessage("Must use a valid university email (.edu)")
      return
    }

    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Magic link sent. Check your inbox.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-black text-white">
      
      <div className="w-full max-w-md bg-purple-900/40 backdrop-blur-xl p-8 rounded-3xl border border-purple-700 shadow-2xl">

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg">
            <Sparkles className="text-black" />
          </div>
          <h1 className="text-3xl font-bold">CONNEKT</h1>
          <p className="text-sm text-purple-300">Your Campus. After Dark.</p>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-center">
          University Login
        </h2>

        <div className="space-y-4">
          <div className="flex items-center bg-purple-800 rounded-xl px-4 py-3 border border-purple-600">
            <Mail className="mr-3 text-purple-300" size={18} />
            <input
              type="email"
              placeholder="student@university.edu"
              className="bg-transparent outline-none w-full text-white placeholder-purple-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-400 text-black font-semibold hover:scale-105 transition-transform"
          >
            {loading ? "Sending..." : "Send Magic Link ✨"}
          </button>

          {message && (
            <p className="text-center text-sm text-purple-300">
              {message}
            </p>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-purple-400">
          Must be a valid university address to join the network.
        </div>
      </div>
    </div>
  )
}
