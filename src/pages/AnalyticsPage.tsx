import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/shared/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { useCollection, orderBy } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firebase";
import { Task, User, ActivityLog, Meeting } from "@/types";

const COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626"];

export default function AnalyticsPage() {
  const { data: tasks, loading: tl } = useCollection<Task>(COLLECTIONS.tasks);
  const { data: users, loading: ul } = useCollection<User>(COLLECTIONS.users);
  const { data: activityLogs } = useCollection<ActivityLog>(COLLECTIONS.activityLogs, [orderBy("timestamp", "desc")]);
  const { data: meetings } = useCollection<Meeting>(COLLECTIONS.meetings);

  const taskStats = useMemo(() => ({
    completed: tasks.filter((t) => t.status === "completed").length,
    pending: tasks.filter((t) => t.status !== "completed").length,
    total: tasks.length,
  }), [tasks]);

  const statusData = useMemo(() => {
    const counts = { Todo: 0, "In Progress": 0, Review: 0, Completed: 0 };
    tasks.forEach((t) => {
      if (t.status === "todo") counts.Todo++;
      else if (t.status === "in_progress") counts["In Progress"]++;
      else if (t.status === "review") counts.Review++;
      else counts.Completed++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const memberData = useMemo(() => {
    const map = new Map<string, { completed: number; pending: number }>();
    tasks.forEach((t) => {
      const name = t.assignedToName || "Unassigned";
      const curr = map.get(name) || { completed: 0, pending: 0 };
      if (t.status === "completed") curr.completed++;
      else curr.pending++;
      map.set(name, curr);
    });
    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data }));
  }, [tasks]);

  const weeklyActivity = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = days.map((d) => ({ day: d, activity: 0 }));
    activityLogs.forEach((log) => {
      if (log.timestamp && "toDate" in log.timestamp) {
        const day = log.timestamp.toDate().getDay();
        counts[day].activity++;
      }
    });
    return counts;
  }, [activityLogs]);

  const progress = taskStats.total ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

  if (tl || ul) return <PageSkeleton />;

  return (
    <PageTransition>
      <PageHeader title="Analytics" description="Team productivity and project insights" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Project Progress</p><p className="text-3xl font-semibold mt-1">{progress}%</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Completed Tasks</p><p className="text-3xl font-semibold mt-1">{taskStats.completed}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Pending Tasks</p><p className="text-3xl font-semibold mt-1">{taskStats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Team Size</p><p className="text-3xl font-semibold mt-1">{users.length}</p></CardContent></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Task Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData.filter((d) => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Member Contributions</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={memberData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="completed" fill="#2563EB" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="#94A3B8" name="Pending" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Weekly Activity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="activity" stroke="#2563EB" strokeWidth={2} dot={{ fill: "#2563EB" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Meetings</span><span className="font-medium">{meetings.length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Activity Logs</span><span className="font-medium">{activityLogs.length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Active Members</span><span className="font-medium">{users.filter((u) => u.status === "active").length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Team Productivity</span><span className="font-medium">{progress}%</span></div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
