import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Rocket, Globe, Users, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface Astronaut {
  name: string;
  craft: string;
}

interface ISSPosition {
  latitude: string;
  longitude: string;
}

interface Launch {
  id: string;
  name: string;
  net: string;
  rocket: { configuration: { name: string } };
  status: { abbrev: string; name: string };
}

const SpaceActivities = () => {
  const [astronauts, setAstronauts] = useState<Astronaut[] | null>(null);
  const [astroError, setAstroError] = useState(false);

  const [issPos, setIssPos] = useState<ISSPosition | null>(null);
  const [issError, setIssError] = useState(false);

  const [launches, setLaunches] = useState<Launch[] | null>(null);
  const [launchError, setLaunchError] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    fetch("https://ytitrmdlmjpyhwkbpjvf.supabase.co/functions/v1/iss-proxy?endpoint=astros")
      .then((r) => r.json())
      .then((d) => {
        if (d?.fallback) setAstroError(true);
        else setAstronauts(d.people ?? []);
      })
      .catch(() => setAstroError(true));

    const fetchISS = () =>
      fetch("https://ytitrmdlmjpyhwkbpjvf.supabase.co/functions/v1/iss-proxy?endpoint=iss_now")
        .then((r) => r.ok ? r.json() : Promise.reject(r.status))
        .then((d) => {
          if (d?.fallback || !d?.iss_position) return; // keep last known, skip
          setIssPos(d.iss_position);
          setIssError(false);
        })
        .catch(() => {
          setIssPos((prev) => {
            if (!prev) setIssError(true);
            return prev;
          });
        });

    fetchISS();
    intervalRef.current = setInterval(fetchISS, 5000);

    fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&format=json")
      .then((r) => r.json())
      .then((d) => setLaunches(d.results ?? []))
      .catch(() => setLaunchError(true));

    return () => clearInterval(intervalRef.current);
  }, []);

  const grouped = astronauts?.reduce<Record<string, string[]>>((acc, a) => {
    (acc[a.craft] ??= []).push(a.name);
    return acc;
  }, {});

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold text-foreground">Human Space Activities</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Astronauts */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Humans in Space
              {astronauts && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {astronauts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {astroError ? (
              <ErrorMsg />
            ) : !astronauts ? (
              <ListSkeleton count={4} />
            ) : (
              <div className="space-y-3">
                {grouped &&
                  Object.entries(grouped).map(([craft, names]) => (
                    <div key={craft}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{craft}</p>
                      <ul className="space-y-0.5">
                        {names.map((n) => (
                          <li key={n} className="text-sm text-foreground/90">{n}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ISS Position */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              ISS Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            {issError ? (
              <ErrorMsg />
            ) : !issPos ? (
              <ListSkeleton count={2} />
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Latitude</p>
                    <p className="text-lg font-mono text-foreground">{parseFloat(issPos.latitude).toFixed(4)}°</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Longitude</p>
                    <p className="text-lg font-mono text-foreground">{parseFloat(issPos.longitude).toFixed(4)}°</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Updated every 5s</p>
                <a
                  href="https://www.nasa.gov/international-space-station/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  NASA ISS Page <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Launches */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="w-4 h-4 text-primary" />
              Upcoming Launches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {launchError ? (
              <ErrorMsg />
            ) : !launches ? (
              <ListSkeleton count={5} />
            ) : (
              <ul className="space-y-3">
                {launches.map((l) => (
                  <li key={l.id} className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground/90 leading-tight">{l.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.rocket?.configuration?.name} · {new Date(l.net).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {l.status?.abbrev ?? l.status?.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.section>
  );
};

const ErrorMsg = () => (
  <div className="flex items-center gap-2 text-xs text-destructive">
    <AlertCircle className="w-3.5 h-3.5" />
    <span>Failed to load data</span>
  </div>
);

const ListSkeleton = ({ count }: { count: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-4 w-full" />
    ))}
  </div>
);

export default SpaceActivities;
