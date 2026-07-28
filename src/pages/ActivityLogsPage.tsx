import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/shared/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/PageSkeleton";
import { useCollection, orderBy } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firebase";
import { ActivityLog } from "@/types";
import { formatDateTime, paginate } from "@/lib/utils";

const PAGE_SIZE = 15;

export default function ActivityLogsPage() {
  const { data: logs, loading } = useCollection<ActivityLog>(COLLECTIONS.activityLogs, [orderBy("timestamp", "desc")]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() =>
    logs.filter((l) => {
      const q = (search || "").toString().toLowerCase();
      const action = (l.action || "").toString().toLowerCase();
      const email = (l.userEmail || "").toString().toLowerCase();
      return action.includes(q) || email.includes(q);
    }), [logs, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = paginate(filtered, page, PAGE_SIZE);

  if (loading) return <TableSkeleton />;

  return (
    <PageTransition>
      <PageHeader title="Activity Logs" description="Audit trail of all platform actions" />
      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search activity..." className="mb-6 max-w-sm" />
      {paginated.length === 0 ? (
        <EmptyState icon={Activity} title="No activity logs" description="Actions will be recorded here as team members use the platform." />
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className="text-[10px]">{log.timestamp ? formatDateTime(log.timestamp) : "—"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
        </>
      )}
    </PageTransition>
  );
}
