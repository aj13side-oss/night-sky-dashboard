import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

interface Props {
  ra: number;
  dec: number;
  fovDeg: number;
}

declare global {
  interface Window {
    A: any;
  }
}

let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadAladinScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    if (scriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }
    scriptLoading = true;

    // Load CSS
    if (!document.querySelector('link[href*="aladin"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.min.css";
      document.head.appendChild(link);
    }

    // Load JS
    const script = document.createElement("script");
    script.src = "https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.min.js";
    script.charset = "utf-8";
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

const AladinLiteViewer = ({ ra, dec, fovDeg }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const aladinRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadAladinScript().then(() => {
      if (cancelled || !containerRef.current) return;

      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        if (cancelled || !containerRef.current || !window.A) return;
        try {
          const aladin = window.A.aladin(containerRef.current, {
            survey: "P/DSS2/color",
            fov: fovDeg,
            target: `${ra} ${dec}`,
            showReticle: true,
            showZoomControl: false,
            showLayersControl: false,
            showGotoControl: false,
            showFrame: false,
            showCooGrid: false,
          });
          aladinRef.current = aladin;
          setReady(true);
        } catch (e) {
          console.error("Aladin init error:", e);
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [ra, dec, fovDeg]);

  const handleRecenter = () => {
    if (aladinRef.current) {
      aladinRef.current.gotoRaDec(ra, dec);
      aladinRef.current.setFoV(fovDeg);
    }
  };

  return (
    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted/50 border border-border/30">
      <div ref={containerRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      {ready && (
        <button
          onClick={handleRecenter}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors z-10"
          title="Recenter"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default AladinLiteViewer;
