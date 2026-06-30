import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocalizedPath } from "@/lib/localized-nav";
import { ObservationProvider, useObservation } from "@/contexts/ObservationContext";
import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import ObservationToolbar from "@/components/ObservationToolbar";
import MoonPhaseCard from "@/components/MoonPhaseCard";
import SunTimesCard from "@/components/SunTimesCard";
import HourlyWeatherCard from "@/components/HourlyWeatherCard";
import CometsCard from "@/components/dashboard/CometsCard";
import PlanetsTonight from "@/components/dashboard/PlanetsTonight";
import DeepSkyTonight from "@/components/dashboard/DeepSkyTonight";
import SpecialEvents from "@/components/dashboard/SpecialEvents";
import TonightList from "@/components/dashboard/TonightList";
import EventBanner from "@/components/dashboard/EventBanner";
import QuickActions from "@/components/dashboard/QuickActions";
import SpaceActivities from "@/components/dashboard/SpaceActivities";
import SkyEvents from "@/components/dashboard/SkyEvents";
import { motion } from "framer-motion";

const DashboardContent = () => {
  const { location } = useObservation();
  const lp = useLocalizedPath();
  const { t } = useTranslation("dashboard");

  return (
    <div className="min-h-screen bg-background star-field">
      <SEOHead
        title="Astro Weather Tonight & Astrophotography Planner"
        description="Free astrophotography planning dashboard: real-time astro weather, moon phase, best deep sky targets tonight, ISS passes and aurora forecast. Updated live for your location."
        keywords="astro weather, astrophotography tonight, what to photograph tonight, moon phase, astronomy ephemerides, deep sky targets, observation conditions, seeing, cloud cover, météo astro, astrophotographie"
        canonical="https://cosmicframe.app/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What should I photograph tonight as a beginner?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Beginners should start with bright, large targets that are forgiving of tracking and exposure errors. Tonight, check our dashboard for the best visible Messier objects like the Orion Nebula (M42) or the Andromeda Galaxy (M31). These are easy to find, photograph beautifully even with short exposures, and provide stunning results for new astrophotographers."
              }
            },
            {
              "@type": "Question",
              "name": "What should a beginner photograph tonight?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Beginners should start with bright, large targets that are forgiving of tracking and exposure errors. Tonight, check our dashboard for the best visible Messier objects like the Orion Nebula (M42) or the Andromeda Galaxy (M31). These are easy to find, photograph beautifully even with short exposures, and provide stunning results for new astrophotographers."
              }
            },
            {
              "@type": "Question",
              "name": "How does the astro weather forecast work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Cosmic Frame combines hourly cloud cover, seeing, transparency and humidity data to give you a real-time score for astrophotography conditions. The forecast updates live for your chosen location so you can plan the perfect night under the stars."
              }
            },
            {
              "@type": "Question",
              "name": "What equipment do I need for deep sky astrophotography?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "At minimum you need a telescope or telephoto lens, a tracking mount (equatorial or alt-az with field derotator), an astro camera or DSLR, and a laptop or ASIAIR for control. Use our gear catalog and FOV calculator to find compatible setups for your budget and targets."
              }
            }
          ]
        }}
      />
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("hero.title")}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {t("hero.tonightSky", { location: location.name })}
          </p>
        </motion.div>

        <EventBanner />
        <QuickActions />
        <ObservationToolbar />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MoonPhaseCard />
          <SunTimesCard />
        </div>

        <HourlyWeatherCard />

        {/* 3-card layout: Planets | Deep Sky (wider) | Special Events */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <PlanetsTonight />
          </div>
          <div className="lg:col-span-6">
            <DeepSkyTonight />
          </div>
          <div className="lg:col-span-3">
            <SpecialEvents />
          </div>
        </div>

        <TonightList />

        <SkyEvents />

        <CometsCard />

        <SpaceActivities />

        {/* SEO Content Section — collapsible */}
        <details className="space-y-6 pt-8 border-t border-border/20">
          <summary className="text-sm font-medium text-foreground/60 cursor-pointer hover:text-foreground/80 transition-colors">
            {t("about.toggle")}
          </summary>
          <div className="space-y-6 pt-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground/80">
                {t("about.heading")}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
                {t("about.intro")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(["catalog","gear","calculators","weather","lightPollution","exposure"] as const).map((k) => (
                <article key={k}>
                  <h3 className="text-sm font-medium text-foreground/70">{t(`about.features.${k}.title`)}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t(`about.features.${k}.body`)}
                  </p>
                </article>
              ))}
            </div>

            <div className="space-y-3 text-xs text-muted-foreground/70 leading-relaxed">
              <div>
                <h3 className="text-sm font-medium text-foreground/60 mb-1">{t("about.brands.title")}</h3>
                <p>{t("about.brands.body")}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground/60 mb-1">{t("about.types.title")}</h3>
                <p>{t("about.types.body")}</p>
                <p className="mt-2">
                  {t("about.types.popularPrefix")}
                  <Link to={lp(`/object/${encodeURIComponent('M 42')}`)} className="text-primary hover:underline">{t("about.types.links.m42")}</Link>,{' '}
                  <Link to={lp(`/object/${encodeURIComponent('M 31')}`)} className="text-primary hover:underline">{t("about.types.links.m31")}</Link>,{' '}
                  <Link to={lp(`/object/${encodeURIComponent('M 45')}`)} className="text-primary hover:underline">{t("about.types.links.m45")}</Link>,{' '}
                  <Link to={lp(`/object/${encodeURIComponent('M 51')}`)} className="text-primary hover:underline">{t("about.types.links.m51")}</Link>.{' '}
                  {t("about.types.otherNotable")}
                </p>
              </div>
            </div>
          </div>
        </details>

        {/* FAQ Section */}
        <details className="space-y-4 pt-6 border-t border-border/20">
          <summary className="text-sm font-medium text-foreground/60 cursor-pointer hover:text-foreground/80 transition-colors">
            {t("faq.toggle")}
          </summary>
          <div className="space-y-4 pt-4" itemScope itemType="https://schema.org/FAQPage">
            {(["q1","q2","q3","q4"] as const).map((k) => (
              <div key={k} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <h3 itemProp="name" className="text-sm font-medium text-foreground/80">
                  {t(`faq.${k}.q`)}
                </h3>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p itemProp="text" className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                    {t(`faq.${k}.a`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </details>
      </main>

      <Footer />
    </div>
  );
};

const Index = () => (
  <ObservationProvider>
    <DashboardContent />
  </ObservationProvider>
);

export default Index;
