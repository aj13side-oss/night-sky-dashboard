import { useEffect, useState, useMemo } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, X, RefreshCw, Search, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type AuditableItem = {
  id: string;
  label: string;
  sublabel?: string;
  hasImage: boolean;
  status?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AuditableItem[];
  onAction: (id: string, action: "ok" | "flag" | "replace" | "google" | "focus") => void;
};

export default function AuditCommandPalette({ open, onOpenChange, items, onAction }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setSearch(""); setSelectedId(null); }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items.slice(0, 20);
    const q = search.toLowerCase();
    return items.filter(i =>
      i.label.toLowerCase().includes(q) || (i.sublabel?.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [items, search]);

  const fire = (action: "ok" | "flag" | "replace" | "google" | "focus", id: string) => {
    onAction(id, action);
    if (action !== "replace" && action !== "focus") return;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-lg overflow-hidden">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search product or object…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
            <CommandGroup>
              {filtered.map(item => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => setSelectedId(selectedId === item.id ? null : item.id)}
                  className="flex flex-col items-start gap-1 py-2"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm font-medium truncate flex-1">{item.label}</span>
                    {!item.hasImage && <Badge variant="outline" className="text-[9px] border-orange-500/50 text-orange-400">No image</Badge>}
                    {item.status === "ok" && <Badge className="text-[9px] bg-green-500/20 text-green-400 border-green-500/50">✓</Badge>}
                    {item.status === "flagged" && <Badge variant="destructive" className="text-[9px]">⚠</Badge>}
                  </div>
                  {item.sublabel && <span className="text-xs text-muted-foreground">{item.sublabel}</span>}
                  {selectedId === item.id && (
                    <div className="flex gap-1 mt-1">
                      <button onClick={(e) => { e.stopPropagation(); fire("ok", item.id); }}
                        className="px-2 py-0.5 rounded text-xs border border-green-500/50 text-green-400 hover:bg-green-500/20 transition-colors">
                        <Check className="w-3 h-3 inline mr-1" />OK
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); fire("flag", item.id); }}
                        className="px-2 py-0.5 rounded text-xs border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-colors">
                        <X className="w-3 h-3 inline mr-1" />Flag
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); fire("replace", item.id); }}
                        className="px-2 py-0.5 rounded text-xs border border-primary/50 text-primary hover:bg-primary/20 transition-colors">
                        <RefreshCw className="w-3 h-3 inline mr-1" />Remplacer
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); fire("google", item.id); }}
                        className="px-2 py-0.5 rounded text-xs border border-blue-500/50 text-blue-400 hover:bg-blue-500/20 transition-colors">
                        <Search className="w-3 h-3 inline mr-1" />Google
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); fire("focus", item.id); }}
                        className="px-2 py-0.5 rounded text-xs border border-border text-muted-foreground hover:bg-muted transition-colors">
                        <Eye className="w-3 h-3 inline mr-1" />Voir
                      </button>
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="px-3 py-1.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex gap-3">
          <span><kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px]">↑↓</kbd> naviguer</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px]">Enter</kbd> actions</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px]">Esc</kbd> fermer</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
