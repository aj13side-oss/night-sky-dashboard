import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import AppNav from "@/components/AppNav";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Telescope } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background star-field flex flex-col">
      <SEOHead
        title="Page Not Found"
        description="This page doesn't exist. Explore the Cosmic Frame dashboard or Sky Atlas."
        canonical="https://cosmicframe.app/404"
      />
      <AppNav />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="text-center max-w-md space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-4xl">🔭</span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground text-gradient-gold">
              Lost in Space
            </h1>
            <p className="text-lg text-muted-foreground">
              This page doesn't exist — but the universe is full of things that do.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="gap-2">
              <a href="/">Back to Dashboard</a>
            </Button>
            <Button variant="outline" asChild className="gap-2 border-primary/30 hover:bg-primary/10">
              <a href="/sky-atlas">Explore Sky Atlas</a>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
