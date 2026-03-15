import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Play, Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FunctionDef {
  slug: string;
  label: string;
  jwt: boolean;
  canRun?: boolean;
  testPayload?: Record<string, any>;
}

const FUNCTIONS: FunctionDef[] = [
  { slug: "astronomy", label: "Astronomy", jwt: false, testPayload: { lat: 48.8566, lon: 2.3522 } },
  { slug: "weather", label: "Weather", jwt: false, testPayload: { lat: 48.8566, lon: 2.3522 } },
  { slug: "recommend-targets", label: "Recommend Targets", jwt: false, testPayload: { lat: 48.8566, lon: 2.3522 } },
];

export default function AdminFunctions() {
  const [results, setResults] = useState<Record<string, { status: string; time: number; data?: any; error?: string }>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [openOutputs, setOpenOutputs] = useState<Set<string>>(new Set());

  const testFunction = async (fn: FunctionDef) => {
    setTesting(fn.slug);
    const start = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke(fn.slug, {
        body: fn.testPayload || {},
      });
      const time = Date.now() - start;
      if (error) {
        setResults(prev => ({ ...prev, [fn.slug]: { status: "error", time, error: error.message } }));
        toast.error(`${fn.label}: ${error.message}`);
      } else {
        setResults(prev => ({ ...prev, [fn.slug]: { status: "ok", time, data } }));
        toast.success(`${fn.label}: OK (${time}ms)`);
        setOpenOutputs(prev => new Set([...prev, fn.slug]));
      }
    } catch (err: any) {
      const time = Date.now() - start;
      setResults(prev => ({ ...prev, [fn.slug]: { status: "error", time, error: err.message } }));
      toast.error(`${fn.label}: ${err.message}`);
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Edge Functions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Function</TableHead>
                <TableHead className="text-[10px] text-center">JWT</TableHead>
                <TableHead className="text-[10px] text-center">Status</TableHead>
                <TableHead className="text-[10px] text-center">Response Time</TableHead>
                <TableHead className="text-[10px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FUNCTIONS.map(fn => {
                const result = results[fn.slug];
                return (
                  <TableRow key={fn.slug}>
                    <TableCell className="text-xs font-mono font-medium">{fn.label}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={fn.jwt ? "default" : "secondary"} className="text-[8px]">
                        {fn.jwt ? "JWT" : "Public"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {result ? (
                        <Badge variant={result.status === "ok" ? "default" : "destructive"} className="text-[8px]">
                          {result.status === "ok" ? "✓ OK" : "✗ Error"}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-[10px] font-mono">
                      {result ? `${result.time}ms` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] gap-1"
                        onClick={() => testFunction(fn)}
                        disabled={testing === fn.slug}
                      >
                        {testing === fn.slug ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        Test
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Output panels */}
      {FUNCTIONS.filter(fn => results[fn.slug]).map(fn => (
        <Collapsible key={fn.slug} open={openOutputs.has(fn.slug)} onOpenChange={open => {
          setOpenOutputs(prev => { const next = new Set(prev); open ? next.add(fn.slug) : next.delete(fn.slug); return next; });
        }}>
          <Card className="border-border/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 cursor-pointer hover:bg-muted/20 transition-colors">
                <CardTitle className="text-xs flex items-center gap-2">
                  <ChevronDown className={`w-3 h-3 transition-transform ${openOutputs.has(fn.slug) ? "rotate-180" : ""}`} />
                  {fn.label} Output
                  <Badge variant={results[fn.slug]?.status === "ok" ? "default" : "destructive"} className="text-[8px]">
                    {results[fn.slug]?.time}ms
                  </Badge>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <pre className="text-[10px] font-mono bg-muted/20 rounded p-3 max-h-[300px] overflow-auto whitespace-pre-wrap">
                  {results[fn.slug]?.error || JSON.stringify(results[fn.slug]?.data, null, 2)}
                </pre>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}
