import LegalPageLayout from "@/components/LegalPageLayout";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    {children}
  </section>
);

const Bullets = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="list-disc pl-6 space-y-1">
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ul>
);

export default function PrivacyPolicyEN() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="Cosmic Frame privacy policy: no accounts, anonymous analytics, anonymous feedback, no personal identifiers stored."
      canonical="https://cosmicframe.app/en/privacy-policy"
      updated="July 2026"
      lang="en"
    >
      <Section title="Data controller">
        <p>Anthony — <a className="underline hover:text-foreground" href="mailto:contact@cosmicframe.app">contact@cosmicframe.app</a></p>
      </Section>

      <Section title="Data collected">
        <Bullets items={[
          <>Anonymous analytics via Google Analytics 4 (measurement ID <code className="text-xs">G-ZYDFE1V0BQ</code>). No cross-site tracking, IP anonymization enabled.</>,
          <>Optional feedback submissions: text content only, stored anonymously. No email, no name, no IP address stored with the feedback.</>,
        ]} />
      </Section>

      <Section title="Data NOT collected">
        <Bullets items={[
          "No user accounts, no login system.",
          "No personal identifiers.",
          "No email collection anywhere on the site.",
          "No cookies beyond GA4 analytics.",
        ]} />
      </Section>

      <Section title="Third parties">
        <Bullets items={[
          "Google Analytics (Google LLC) — see the Google privacy policy.",
          "Cloudflare (hosting) — see the Cloudflare privacy policy.",
          "Supabase (feedback storage) — see the Supabase privacy policy.",
        ]} />
      </Section>

      <Section title="Data retention">
        <Bullets items={[
          "GA4 data: 14 months maximum (GA4 default).",
          "Feedback text: retained indefinitely for product improvement, can be deleted on request.",
        ]} />
      </Section>

      <Section title="Your rights under GDPR">
        <Bullets items={[
          "Access, rectification, deletion, portability, opposition.",
          <>Contact: <a className="underline hover:text-foreground" href="mailto:contact@cosmicframe.app">contact@cosmicframe.app</a></>,
          "Right to lodge a complaint with the CNIL (French data protection authority).",
        ]} />
        <p className="text-sm">
          Because we collect no personal identifiers, most GDPR rights only apply if you can help us
          identify your specific feedback submission (e.g. by quoting the text you submitted).
        </p>
      </Section>
    </LegalPageLayout>
  );
}
