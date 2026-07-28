import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  TrendingUp,
  ListTodo,
  Megaphone,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/shared/PageTransition";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { useCollection, orderBy } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firebase";
import { Task, User, Announcement, Meeting, ActivityLog, PlatformSettings } from "@/types";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { formatDate, getDaysRemaining } from "@/lib/utils";

const COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706"];

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-semibold mt-1">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(COLLECTIONS.tasks);
  const { data: users, loading: usersLoading } = useCollection<User>(COLLECTIONS.users);
  const { data: announcements } = useCollection<Announcement>(
    COLLECTIONS.announcements,
    [orderBy("createdAt", "desc")]
  );
  const { data: meetings } = useCollection<Meeting>(COLLECTIONS.meetings);
  const { data: activityLogs } = useCollection<ActivityLog>(
    COLLECTIONS.activityLogs,
    [orderBy("timestamp", "desc")]
  );
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, COLLECTIONS.settings, "platform"), (snap) => {
      if (snap.exists()) setSettings({ id: snap.id, ...snap.data() } as PlatformSettings);
    });
    return unsub;
  }, []);

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "completed").length;
    const pending = tasks.filter((t) => t.status !== "completed").length;
    const activeMembers = users.filter((u) => u.status === "active").length;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    return { completed, pending, activeMembers, progress, total: tasks.length };
  }, [tasks, users]);

  const taskDistribution = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, review: 0, completed: 0 };
    tasks.forEach((t) => { counts[t.status]++; });
    return [
      { name: "Todo", value: counts.todo },
      { name: "In Progress", value: counts.in_progress },
      { name: "Review", value: counts.review },
      { name: "Completed", value: counts.completed },
    ].filter((d) => d.value > 0);
  }, [tasks]);

  const memberContributions = useMemo(() => {
    const map = new Map<string, number>();
    tasks.filter((t) => t.status === "completed").forEach((t) => {
      const name = t.assignedToName || "Unassigned";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, tasks]) => ({ name, tasks }));
  }, [tasks]);

  const upcomingMeetings = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return meetings
      .filter((m) => m.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [meetings]);

  const daysRemaining = settings?.sihDeadline
    ? getDaysRemaining(settings.sihDeadline)
    : 90;

  if (tasksLoading || usersLoading) return <PageSkeleton />;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              {settings?.projectName || "SIH 2026"} — Team Overview
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/10 px-4 py-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{daysRemaining} days until SIH</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Overall Progress" value={`${stats.progress}%`} icon={TrendingUp} delay={0} />
          <StatCard title="Pending Tasks" value={stats.pending} icon={ListTodo} delay={0.05} />
          <StatCard title="Completed Tasks" value={stats.completed} icon={CheckCircle2} delay={0.1} />
          <StatCard title="Active Members" value={stats.activeMembers} icon={Users} delay={0.15} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {taskDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={taskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {taskDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              {memberContributions.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={memberContributions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No completed tasks yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Announcements
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/announcements">View all <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.slice(0, 4).map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    <Badge variant={a.priority === "high" ? "destructive" : "secondary"} className="text-[10px]">
                      {a.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No announcements</p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Meetings
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/meetings">View all <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMeetings.map((m) => (
                <div key={m.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(m.date)} at {m.time}
                  </p>
                </div>
              ))}
              {upcomingMeetings.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming meetings</p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                  </div>
                </div>
              ))}
              {activityLogs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline"><Link to="/tasks">Manage Tasks</Link></Button>
              <Button asChild variant="outline"><Link to="/documents">Add Document</Link></Button>
              <Button asChild variant="outline"><Link to="/meetings">Schedule Meeting</Link></Button>
              <Button asChild variant="outline"><Link to="/ideas">Submit Idea</Link></Button>
              <Button asChild variant="outline"><Link to="/chat">Team Chat</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
