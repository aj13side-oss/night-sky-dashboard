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

export default function CookiePolicyFR() {
  return (
    <LegalPageLayout
      title="Politique cookies"
      description="Cookies utilisés par Cosmic Frame : uniquement Google Analytics 4. Aucun cookie publicitaire, aucun traçage tiers."
      canonical="https://cosmicframe.app/fr/politique-cookies"
      updated="Juillet 2026"
      lang="fr"
    >
      <Section title="Cookies utilisés sur ce site">
        <Bullets items={[
          <>Cookies Google Analytics 4 : <code className="text-xs">_ga</code>, <code className="text-xs">_ga_ZYDFE1V0BQ</code>.</>,
          "Finalité : mesurer l'audience du site et améliorer l'expérience utilisateur.",
          "Durée : jusqu'à 13 mois.",
          "Catégorie : analytics (soumis au consentement en droit européen).",
        ]} />
      </Section>

      <Section title="Comment les désactiver">
        <Bullets items={[
          "Réglez votre navigateur pour refuser les cookies.",
          <>Utilisez le <a className="underline hover:text-foreground" href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">module de désactivation de Google Analytics</a>.</>,
          "Utilisez une extension comme uBlock Origin ou Privacy Badger.",
        ]} />
      </Section>

      <Section title="Ce que nous n'utilisons PAS">
        <p>Aucun cookie publicitaire, aucun traçage tiers, aucun pixel de réseau social.</p>
      </Section>
    </LegalPageLayout>
  );
}
