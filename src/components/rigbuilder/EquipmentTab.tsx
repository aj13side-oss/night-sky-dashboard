import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface EquipmentTabProps {
  loading: boolean;
  filters: React.ReactNode;
  searchBar: React.ReactNode;
  resultCount: number;
  searchQuery: string;
  children: React.ReactNode;
  compareTable?: React.ReactNode;
}

export function EquipmentTab({ loading, filters, searchBar, resultCount, searchQuery, children, compareTable }: EquipmentTabProps) {
  if (loading) return <LoadingSkeleton />;

  return (
    <>
      {searchBar}

      <p className="text-xs text-muted-foreground mt-2">
        {resultCount} result{resultCount > 1 ? "s" : ""}
        {searchQuery && ` for "${searchQuery}"`}
      </p>

      <Card className="border-border/50 mt-4 p-4 space-y-4">
        {filters}
      </Card>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mt-4">
        {children}
      </div>

      {compareTable}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
