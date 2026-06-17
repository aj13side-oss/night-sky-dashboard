import AppNav from "@/components/AppNav";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Privacy Policy"
        description="Cosmic Frame privacy policy: no personal data collection, local-only storage, Google Analytics 4 usage data, and public data sources."
        canonical="https://cosmicframe.app/privacy"
      />
      <AppNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: June 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">No accounts required</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cosmic Frame does not require user accounts and does not collect
            personal data such as your name, email address, or payment
            information. You can use the full site without registering.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use Google Analytics 4 to understand how visitors use the site
            (pages visited, session duration, country of origin). Google
            Analytics may set cookies and sends anonymised usage data to
            Google's servers. No personally identifiable information is
            collected. You can opt out at any time by using the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Google Analytics opt-out browser add-on
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Location data</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you allow browser geolocation, your coordinates are used only
            for local astronomy calculations (rise/set times, visibility, and
            altitude charts). Your location is stored in your browser's
            localStorage and is never transmitted to our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Equipment preferences</h2>
          <p className="text-muted-foreground leading-relaxed">
            Telescope, camera, and filter selections you save in the Rig
            Builder and FOV Calculator are stored locally in your browser.
            They are not sent to any server.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Third-party data sources</h2>
          <p className="text-muted-foreground leading-relaxed">
            Astronomy data is sourced from public APIs including USNO, NOAA,
            and NASA. Search-based geocoding uses Nominatim (OpenStreetMap).
            These services may log your IP address according to their own
            privacy policies.
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
