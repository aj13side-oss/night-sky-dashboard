import { useLocalizedNavigate } from "@/lib/localized-nav";
import { ClipboardList, Map, Crosshair, Eclipse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const QuickActions = () => {
  const navigate = useLocalizedNavigate();
  const { t } = useTranslation("dashboard");

  const actions = [
    { label: t("quickActions.tonightsBest"), icon: ClipboardList, to: "/sky-atlas?filter=tonight" },
    { label: t("quickActions.openAtlas"), icon: Map, to: "/sky-atlas" },
    { label: t("quickActions.frameObject"), icon: Crosshair, to: "/fov-calculator" },
    { label: t("quickActions.checkLightPollution"), icon: Eclipse, to: "/light-pollution" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
    >
      {actions.map((a) => (
        <Button
          key={a.to}
          variant="outline"
          size="sm"
          className="gap-2 text-xs whitespace-nowrap shrink-0"
          onClick={() => navigate(a.to)}
        >
          <a.icon className="w-3.5 h-3.5" />
          {a.label}
        </Button>
      ))}
    </motion.div>
  );
};

export default QuickActions;
