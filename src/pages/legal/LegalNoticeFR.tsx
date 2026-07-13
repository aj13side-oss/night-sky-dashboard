import LegalPageLayout from "@/components/LegalPageLayout";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    {children}
  </section>
);

export default function LegalNoticeFR() {
  return (
    <LegalPageLayout
      title="Mentions légales"
      description="Mentions légales de Cosmic Frame — éditeur, hébergeur et finalité du site."
      canonical="https://cosmicframe.app/fr/mentions-legales"
      updated="Juillet 2026"
      lang="fr"
    >
      <Section title="Site">
        <p>Nom du site : Cosmic Frame</p>
        <p>URL : <a className="underline hover:text-foreground" href="https://cosmicframe.app">https://cosmicframe.app</a></p>
      </Section>
      <Section title="Éditeur">
        <p>Anthony — particulier (projet personnel, non constitué en société).</p>
        <p>Contact : <a className="underline hover:text-foreground" href="mailto:contact@cosmicframe.app">contact@cosmicframe.app</a></p>
      </Section>
      <Section title="Hébergeur">
        <p>Cloudflare, Inc. — 101 Townsend St, San Francisco, CA 94107, USA.</p>
      </Section>
      <Section title="Finalité">
        <p>Outil éducatif et de planification pour l'astrophotographie.</p>
        <p>Le site est mis à disposition gratuitement, en l'état, sans garantie d'aucune sorte.</p>
      </Section>
    </LegalPageLayout>
  );
}
