"use client"

import React, { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError("Bitte E-Mail und Passwort eingeben.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError("Die Zugangsdaten sind nicht korrekt.")
      } else {
        router.push("/dashboard")
      }
    } catch {
      setError("Technischer Fehler. Bitte erneut versuchen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-200px)] items-center justify-center px-5 py-16">
      <div className="w-full max-w-[420px]">
        {/* Logo + Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#003856]">
            <span className="text-[14px] font-bold text-white">KA</span>
          </div>
          <h1 className="mt-5 text-[1.5rem] font-semibold tracking-tight text-gray-950">
            Anmelden
          </h1>
          <p className="mt-1.5 text-[14px] text-gray-500">
            Zugang zum KanzleiAI Workspace
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-gray-700">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ihre@kanzlei.de"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-[13px] font-medium text-gray-700">
                Passwort
              </label>
              <Link href="/password-reset" className="text-[12px] font-medium text-gold-700 hover:text-gold-600">
                Vergessen?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#003856] py-3.5 text-[14px] font-medium text-white transition-all hover:bg-[#002a42] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </button>
        </form>

        {/* SSO Divider */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[12px] text-gray-400">oder</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* SSO Button */}
        <button
          disabled
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full border border-gray-200 bg-white py-3.5 text-[14px] font-medium text-gray-400 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
          </svg>
          Microsoft SSO (bald verfügbar)
        </button>

        <p className="mt-6 text-center text-[12px] text-gray-400">
          Noch kein Konto?{" "}
          <Link href="/enterprise-kontakt" className="font-medium text-gold-700 hover:text-gold-600">
            Demo anfragen
          </Link>
        </p>
      </div>
    </main>
  )
}
