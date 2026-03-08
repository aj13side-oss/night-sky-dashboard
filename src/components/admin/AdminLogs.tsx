import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function AdminLogs() {
  const [scraping, setScraping] = useState(false);
  const [fetchingImages, setFetchingImages] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin_scrape_logs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("price_scrape_log")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const handleScrape = async () => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("trigger_price_scrape" as any);
      if (error) throw error;
      toast.success("Scrape lancé !", { description: JSON.stringify(data).slice(0, 100) });
    } catch (e: any) {
      toast.error("Erreur scrape: " + (e.message ?? "Inconnu"));
    } finally {
      setScraping(false);
    }
  };

  const handleFetchImages = async () => {
    setFetchingImages(true);
    try {
      const { data, error } = await supabase.functions.invoke("trigger_image_fetch" as any);
      if (error) throw error;
      toast.success("Fetch images lancé !", { description: JSON.stringify(data).slice(0, 100) });
    } catch (e: any) {
      toast.error("Erreur images: " + (e.message ?? "Inconnu"));
    } finally {
      setFetchingImages(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-3">
        <Button onClick={handleScrape} disabled={scraping} className="gap-2">
          {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Re-scraper les prix
        </Button>
        <Button onClick={handleFetchImages} disabled={fetchingImages} variant="outline" className="gap-2">
          {fetchingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          Re-scraper les images
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Chargement des logs...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Date</TableHead>
                  <TableHead className="text-[10px]">Statut</TableHead>
                  <TableHead className="text-[10px]">Prix mis à jour</TableHead>
                  <TableHead className="text-[10px]">Erreurs</TableHead>
                  <TableHead className="text-[10px]">Durée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logs ?? []).map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-[10px] font-mono">
                      {log.started_at ? new Date(log.started_at).toLocaleString("fr-FR") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-[8px]">
                        {log.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono text-green-400">{log.prices_updated ?? 0}</TableCell>
                    <TableCell className="text-[10px] font-mono text-red-400">{log.errors_count ?? 0}</TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground">
                      {log.started_at && log.finished_at
                        ? `${((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000).toFixed(0)}s`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {(!logs || logs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-4">Aucun log</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
