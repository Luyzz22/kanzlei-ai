import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-3xl font-semibold">Anmeldung</h1>
      <p className="text-sm text-muted-foreground">
        NextAuth v5 ist vorbereitet. Verbinden Sie diese Seite mit Server Actions für E-Mail/Passwort und OAuth.
      </p>
      <div className="rounded-lg border p-4 text-sm">
        Unterstützte Provider: E-Mail/Passwort, Google OAuth2 und Microsoft OAuth2.
      </div>
      <Button className="w-full">Mit Google fortfahren</Button>
      <Button variant="secondary" className="w-full">
        Mit Microsoft fortfahren
      </Button>
    </main>
  )
}
