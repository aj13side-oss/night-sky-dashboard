import LegalPageLayout from "@/components/LegalPageLayout";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    {children}
  </section>
);

export default function LegalNoticeEN() {
  return (
    <LegalPageLayout
      title="Legal Notice"
      description="Legal notice for Cosmic Frame — publisher, hosting provider, and site purpose."
      canonical="https://cosmicframe.app/en/legal-notice"
      updated="July 2026"
      lang="en"
    >
      <Section title="Site">
        <p>Site name: Cosmic Frame</p>
        <p>Site URL: <a className="underline hover:text-foreground" href="https://cosmicframe.app">https://cosmicframe.app</a></p>
      </Section>
      <Section title="Publisher">
        <p>Anthony — individual (personal project, not a registered company).</p>
        <p>Contact: <a className="underline hover:text-foreground" href="mailto:contact@cosmicframe.app">contact@cosmicframe.app</a></p>
      </Section>
      <Section title="Hosting provider">
        <p>Cloudflare, Inc. — 101 Townsend St, San Francisco, CA 94107, USA.</p>
      </Section>
      <Section title="Purpose">
        <p>Astrophotography planning and educational tool.</p>
        <p>The site is provided free of charge, as-is, without warranty of any kind.</p>
      </Section>
    </LegalPageLayout>
  );
}
