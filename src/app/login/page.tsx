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
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-100 sm:p-8 lg:grid-cols-[1.1fr_420px]">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Zugang · KanzleiAI</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Anmeldung zum Workspace</h1>
          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            Melden Sie sich an, um tenant-gebundene Dokumente, Review-Queue und Governance-Flächen im geschützten
            Arbeitsbereich zu öffnen.
          </p>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">Dokumente und Verträge im Prüfkontext</div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">Freigabe- und Audit-Nachweise pro Mandant</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          {error && <div className="mb-5 rounded-lg border border-rose-200/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ihre@email.de"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 placeholder:text-slate-500 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300/30"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 placeholder:text-slate-500 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Anmeldung läuft..." : "Anmelden"}
            </button>

            <div className="rounded-lg border border-dashed border-slate-700 px-4 py-4 text-center text-sm text-slate-400">
              SSO-Einstieg (SAML/Entra) wird im nächsten Ausbauschritt ergänzt.
            </div>
          </form>

          <footer className="mt-5 text-sm text-slate-300">
            <Link href="/password-reset" className="font-medium underline underline-offset-4 hover:text-white">
              Passwort vergessen?
            </Link>
          </footer>
        </div>
      </section>
    </main>
  )
}
