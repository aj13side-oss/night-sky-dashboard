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

export default function CookiePolicyEN() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="Cookies used by Cosmic Frame: only Google Analytics 4. No advertising cookies, no third-party tracking."
      canonical="https://cosmicframe.app/en/cookie-policy"
      updated="July 2026"
      lang="en"
    >
      <Section title="Cookies used on this site">
        <Bullets items={[
          <>Google Analytics 4 cookies: <code className="text-xs">_ga</code>, <code className="text-xs">_ga_ZYDFE1V0BQ</code>.</>,
          "Purpose: measure site traffic and improve user experience.",
          "Duration: up to 13 months.",
          "Category: analytics (subject to consent under EU law).",
        ]} />
      </Section>

      <Section title="How to disable">
        <Bullets items={[
          "Adjust your browser settings to refuse cookies.",
          <>Use the <a className="underline hover:text-foreground" href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics opt-out browser add-on</a>.</>,
          "Use a browser extension like uBlock Origin or Privacy Badger.",
        ]} />
      </Section>

      <Section title="What we do NOT use">
        <p>No advertising cookies, no third-party tracking, no social media pixels.</p>
      </Section>
    </LegalPageLayout>
  );
}
