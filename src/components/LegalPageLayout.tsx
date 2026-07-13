import { ReactNode } from "react";
import AppNav from "@/components/AppNav";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

interface Props {
  title: string;
  description: string;
  canonical: string;
  updated: string;
  children: ReactNode;
  lang?: "en" | "fr";
}

const LegalPageLayout = ({ title, description, canonical, updated, children, lang = "en" }: Props) => (
  <div className="min-h-screen bg-background">
    <SEOHead title={title} description={description} canonical={canonical} />
    <AppNav />
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <article className="space-y-6 text-muted-foreground leading-relaxed">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        </header>
        {children}
        <p className="pt-8 text-xs text-muted-foreground/60 border-t border-border/30">
          {lang === "fr" ? "Dernière mise à jour" : "Last updated"} : {updated}
        </p>
      </article>
    </main>
    <Footer />
  </div>
);

export default LegalPageLayout;
