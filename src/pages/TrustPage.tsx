import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Database, Bell, Mail } from "lucide-react";

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/profile" className="p-2 -ml-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Trust & Privacy</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <section className="rounded-xl border border-border p-5 bg-card">
          <p className="text-sm text-muted-foreground">
            This page is maintained by the Streakly team to answer common security
            and privacy questions about the Streakly app. It describes controls
            currently enabled in the app — it is not a certification and is not
            independently verified.
          </p>
        </section>

        <Section icon={<Shield className="w-5 h-5" />} title="Authentication & access">
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
            <li>Sign in with email/password or Google OAuth.</li>
            <li>Sessions are managed by our backend auth provider with secure tokens.</li>
            <li>Each user only has access to their own goals, logs, todos, and profile data.</li>
          </ul>
        </Section>

        <Section icon={<Database className="w-5 h-5" />} title="Data & storage">
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
            <li>App data (goals, habits, logs, todos, badges, profile) is stored in our managed backend database.</li>
            <li>Row-level security policies restrict each row to the user who created it.</li>
            <li>Data in transit is protected with HTTPS/TLS.</li>
          </ul>
        </Section>

        <Section icon={<Lock className="w-5 h-5" />} title="AI features">
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
            <li>AI coaching requests are proxied through a server-side edge function.</li>
            <li>Third-party AI API keys are never exposed to the browser.</li>
            <li>Only the content you submit to the coach is sent to the AI provider.</li>
          </ul>
        </Section>

        <Section icon={<Bell className="w-5 h-5" />} title="Notifications">
          <p className="text-sm text-muted-foreground">
            Push notifications are opt-in. You can disable them at any time from
            your device or browser settings.
          </p>
        </Section>

        <Section icon={<Mail className="w-5 h-5" />} title="Contact">
          <p className="text-sm text-muted-foreground">
            Security or privacy questions? Reach out to the app owner through the
            support channel listed in your account settings.
          </p>
        </Section>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Shared responsibility: the underlying hosting and backend platform
          provide infrastructure-level controls; the Streakly team is responsible
          for app configuration, data handling, and your account settings are
          your responsibility.
        </p>
      </main>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border p-5 bg-card space-y-3">
      <div className="flex items-center gap-2 text-foreground">
        <span className="text-primary">{icon}</span>
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
