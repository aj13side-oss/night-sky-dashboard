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

export default function PrivacyPolicyFR() {
  return (
    <LegalPageLayout
      title="Politique de confidentialité"
      description="Politique de confidentialité de Cosmic Frame : aucun compte, analytics anonymes, retours anonymes, aucun identifiant personnel stocké."
      canonical="https://cosmicframe.app/fr/politique-confidentialite"
      updated="15 juillet 2026"
      lang="fr"
    >
      <Section title="Responsable du traitement">
        <p>Anthony — <a className="underline hover:text-foreground" href="mailto:contact@cosmicframe.app">contact@cosmicframe.app</a></p>
      </Section>

      <Section title="Données collectées">
        <Bullets items={[
          <>Analytics anonymes via Google Analytics 4 (identifiant de mesure <code className="text-xs">G-ZYDFE1V0BQ</code>). Aucun suivi inter-sites, anonymisation d'IP activée.</>,
          <>Retours facultatifs : uniquement le contenu textuel, stocké anonymement. Aucun email, aucun nom, aucune adresse IP n'est stocké avec le retour.</>,
        ]} />
      </Section>

      <Section title="Données NON collectées">
        <Bullets items={[
          "Aucun compte utilisateur, aucun système de connexion.",
          "Aucun identifiant personnel.",
          "Aucune collecte d'email nulle part sur le site.",
          "Aucun cookie au-delà de l'analytics GA4.",
        ]} />
      </Section>

      <Section title="Tiers">
        <Bullets items={[
          "Google Analytics (Google LLC) — voir la politique de confidentialité de Google.",
          "Cloudflare (hébergement) — voir la politique de confidentialité de Cloudflare.",
          "Supabase (stockage des retours) — voir la politique de confidentialité de Supabase.",
          <>Cloudflare Turnstile (Cloudflare, Inc.) — protection anti-bot invisible sur le formulaire de retour. Collecte des signaux du navigateur pour distinguer humains et bots. Voir la <a className="underline hover:text-foreground" href="https://www.cloudflare.com/fr-fr/turnstile-privacy-policy/" target="_blank" rel="noopener noreferrer">politique de confidentialité Cloudflare Turnstile</a>.</>,
        ]} />
      </Section>

      <Section title="Durée de conservation">
        <Bullets items={[
          "Données GA4 : 14 mois maximum (valeur par défaut GA4).",
          "Texte des retours : conservé indéfiniment pour l'amélioration du produit, supprimable sur demande.",
        ]} />
      </Section>

      <Section title="Vos droits au titre du RGPD">
        <Bullets items={[
          "Accès, rectification, suppression, portabilité, opposition.",
          <>Contact : <a className="underline hover:text-foreground" href="mailto:contact@cosmicframe.app">contact@cosmicframe.app</a></>,
          "Droit d'introduire une réclamation auprès de la CNIL.",
        ]} />
        <p className="text-sm">
          Parce que nous ne collectons aucun identifiant personnel, la plupart des droits RGPD ne
          s'appliquent que si vous pouvez nous aider à identifier votre retour (par exemple en
          citant le texte que vous avez soumis).
        </p>
      </Section>
    </LegalPageLayout>
  );
}
