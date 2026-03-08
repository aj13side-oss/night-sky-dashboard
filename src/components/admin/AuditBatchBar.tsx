import { Button } from "@/components/ui/button";
import { Check, X, Search, XCircle, Eye } from "lucide-react";

type Props = {
  count: number;
  onOk: () => void;
  onFlag: () => void;
  onNeedsImage?: () => void;
  onGoogle: () => void;
  onClear: () => void;
};

export default function AuditBatchBar({ count, onOk, onFlag, onNeedsImage, onGoogle, onClear }: Props) {
  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 backdrop-blur-sm">
      <span className="text-xs font-medium text-primary">{count} sélectionné{count > 1 ? "s" : ""}</span>
      <div className="flex gap-1 ml-auto">
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-green-500/50 text-green-400 hover:bg-green-500/10" onClick={onOk}>
          <Check className="w-3 h-3" /> OK
        </Button>
        {onNeedsImage && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-amber-500/50 text-amber-400 hover:bg-amber-500/10" onClick={onNeedsImage}>
            <Eye className="w-3 h-3" /> À trouver
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={onFlag}>
          <X className="w-3 h-3" /> Flag
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/10" onClick={onGoogle}>
          <Search className="w-3 h-3" /> Google
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={onClear}>
          <XCircle className="w-3 h-3" /> Effacer
        </Button>
      </div>
    </div>
  );
}
