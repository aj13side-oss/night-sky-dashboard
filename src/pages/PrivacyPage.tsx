import AppNav from "@/components/AppNav";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Privacy Policy — Cosmic Frame"
        description="Cosmic Frame privacy policy: no cookies, no personal data collection, local-only storage, and public data sources."
        canonical="https://cosmicframe.app/privacy"
      />
      <AppNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: June 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">No cookies, no accounts, no tracking</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cosmic Frame does not use cookies, analytics trackers, or advertising identifiers. We do not require user accounts and we do not collect personal data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Location data</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you allow browser geolocation, your coordinates are used only for local astronomy calculations (rise/set times, visibility, and altitude charts). Your location is stored in your browser's localStorage and is never transmitted to our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Equipment preferences</h2>
          <p className="text-muted-foreground leading-relaxed">
            Telescope, camera, and filter selections you save in the Rig Builder and FOV Calculator are stored locally in your browser. They are not sent to any server.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Third-party data sources</h2>
          <p className="text-muted-foreground leading-relaxed">
            Astronomy data is sourced from public APIs and catalogs including USNO, NOAA, and NASA. Search-based geocoding uses Nominatim (OpenStreetMap). These services may log your IP address according to their own privacy policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy questions, contact us through the Cosmic Frame website.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
