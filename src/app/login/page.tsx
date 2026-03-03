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
      setError("Bitte geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein.")
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
        setError("Die Zugangsdaten sind nicht korrekt oder es ist ein Fehler aufgetreten.")
      } else {
        router.push("/dashboard")
      }
    } catch {
      setError("Es ist ein technischer Fehler aufgetreten. Bitte versuchen Sie es erneut.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl sm:p-10">
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-400">
                Kanzlei-AI
              </p>
              <h1 className="mt-4 text-3xl font-semibold text-slate-50">Willkommen zurück</h1>
              <p className="mt-2 text-sm text-slate-300">
                Melden Sie sich an, um Kanzlei-AI zu nutzen.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  E-Mail-Adresse
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ihre@email.de"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Passwort
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Anmeldung läuft..." : "Anmelden"}
              </button>

              <div className="flex items-center gap-4 py-1 text-xs uppercase tracking-wider text-slate-400">
                <span className="h-px flex-1 bg-slate-700" aria-hidden="true" />
                <span>oder</span>
                <span className="h-px flex-1 bg-slate-700" aria-hidden="true" />
              </div>

              <div className="rounded-lg border border-dashed border-slate-700 px-4 py-5 text-center text-sm text-slate-400">
                {/* TODO: SSO-Login (Google / Microsoft) zukünftig hier einbinden */}
              </div>
            </form>
          </section>

          <footer className="mt-6 text-center text-sm text-slate-300">
            <Link
              href="/password-reset"
              className="font-medium text-slate-100 underline-offset-4 hover:underline"
            >
              Passwort vergessen?
            </Link>
            <p className="mt-3">
              Noch kein Konto?{" "}
              <Link
                href="/register"
                className="font-semibold text-amber-300 underline-offset-4 hover:underline"
              >
                Jetzt registrieren
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </main>
  )
}
