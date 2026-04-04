"use client"

import React, { FormEvent, useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

const AUTH_ERRORS: Record<string, string> = {
  OAuthSignin: "SSO-Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.",
  OAuthCallback: "SSO-Callback fehlgeschlagen. Bitte versuchen Sie die Anmeldung erneut.",
  OAuthAccountNotLinked: "Diese E-Mail ist bereits mit einem anderen Konto verknüpft.",
  CredentialsSignin: "Die Zugangsdaten sind nicht korrekt.",
  Default: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
}

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlError = searchParams.get("error")
    if (urlError) {
      setError(AUTH_ERRORS[urlError] || AUTH_ERRORS.Default)
    }
  }, [searchParams])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim() || !password.trim()) { setError("Bitte E-Mail und Passwort eingeben."); return }
    setError(null)
    setLoading(true)
    try {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) { setError("Die Zugangsdaten sind nicht korrekt.") }
      else { router.push(searchParams.get("callbackUrl") || "/dashboard") }
    } catch { setError("Technischer Fehler. Bitte erneut versuchen.") }
    finally { setLoading(false) }
  }

  return (
    <main className="flex min-h-[calc(100vh-200px)] items-center justify-center px-5 py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#003856]">
            <span className="text-[14px] font-bold text-white">KA</span>
          </div>
          <h1 className="mt-5 text-[1.5rem] font-semibold tracking-tight text-gray-950">Anmelden</h1>
          <p className="mt-1.5 text-[14px] text-gray-500">Zugang zum KanzleiAI Workspace</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-gray-700">E-Mail-Adresse</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ihre@kanzlei.de" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-[13px] font-medium text-gray-700">Passwort</label>
              <Link href="/password-reset" className="text-[12px] font-medium text-gold-700 hover:text-gold-600">Vergessen?</Link>
            </div>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-full bg-[#003856] py-3.5 text-[14px] font-medium text-white transition-all hover:bg-[#002a42] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[12px] text-gray-400">oder</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button disabled className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full border border-gray-200 bg-white py-3.5 text-[14px] font-medium text-gray-400 transition-colors">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" /></svg>
          Microsoft SSO (bald verfügbar)
        </button>

        <p className="mt-6 text-center text-[12px] text-gray-400">
          Noch kein Konto?{" "}
          <Link href="/enterprise-kontakt" className="font-medium text-gold-700 hover:text-gold-600">Demo anfragen</Link>
        </p>

        {/* Demo-Hinweis */}
        <div className="mt-6 rounded-xl border border-gold-200 bg-gold-50 p-4">
          <p className="text-[12px] font-medium text-gold-700">🔑 Demo-Zugang</p>
          <p className="mt-1 text-[11px] text-gray-600">E-Mail: demo@kanzlei-ai.com</p>
          <p className="text-[11px] text-gray-600">Passwort: Demo2026!Vertrag</p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-gray-400">Laden...</div>}>
      <LoginForm />
    </Suspense>
  )
}
