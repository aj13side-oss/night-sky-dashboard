import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Crosshair, Eclipse, Home, Map, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolSuggestion {
  to: string;
  icon: React.ElementType;
  title: string;
  question: string;
  cta: string;
}

const ALL_SUGGESTIONS: ToolSuggestion[] = [
  {
    to: "/",
    icon: Home,
    title: "Dashboard",
    question: "What's visible tonight?",
    cta: "See tonight's sky",
  },
  {
    to: "/what-to-watch",
    icon: Sparkles,
    title: "Tonight",
    question: "What should I shoot tonight?",
    cta: "Get recommendations",
  },
  {
    to: "/sky-atlas",
    icon: Map,
    title: "Sky Atlas",
    question: "Looking for a specific target?",
    cta: "Browse the catalog",
  },
  {
    to: "/fov-calculator",
    icon: Crosshair,
    title: "FOV Calculator",
    question: "Will it fit in your frame?",
    cta: "Check your framing",
  },
  {
    to: "/light-pollution",
    icon: Eclipse,
    title: "Dark Sky Map",
    question: "Where to find darker skies?",
    cta: "Find dark sites",
  },
];

const ToolSuggestions = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const suggestions = ALL_SUGGESTIONS.filter((s) => s.to !== pathname);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl p-6 space-y-4"
    >
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Explore More Tools
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {suggestions.map((s) => (
          <button
            key={s.to}
            onClick={() => navigate(s.to)}
            className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all text-left"
          >
            <div className="flex items-center gap-2">
              <s.icon className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {s.title}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground leading-snug">
              {s.question}
            </p>
            <span className="text-xs text-primary group-hover:underline mt-auto">
              {s.cta} →
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default ToolSuggestions;
