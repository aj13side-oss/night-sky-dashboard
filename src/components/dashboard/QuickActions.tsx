import { useNavigate } from "react-router-dom";
import { ClipboardList, Map, Crosshair, Eclipse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const actions = [
  { label: "Tonight's Best", icon: ClipboardList, to: "/sky-atlas?filter=tonight" },
  { label: "Open Atlas", icon: Map, to: "/sky-atlas" },
  { label: "Frame Object", icon: Crosshair, to: "/fov-calculator" },
  { label: "Check Light Pollution", icon: Eclipse, to: "/light-pollution" },
];

const QuickActions = () => {
  const navigate = useNavigate();

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
