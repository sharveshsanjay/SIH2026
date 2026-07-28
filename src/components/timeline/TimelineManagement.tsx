import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Search, CalendarDays, GripVertical, CheckCircle2, Clock3, List, GitBranch, LayoutGrid, Copy, Trash2, PencilLine, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToTimelines, createTimelineMilestone, updateTimelineMilestone, deleteTimelineMilestone, reorderTimelineMilestones, duplicateTimelineMilestone } from "@/lib/timeline-service";
import type { TimelineMilestone, User } from "@/types";

const statusOptions = ["Not Started", "In Progress", "Completed", "On Hold", "Delayed"] as const;
const priorityOptions = ["Low", "Medium", "High", "Critical"] as const;
const viewOptions = ["vertical", "roadmap", "list", "calendar"] as const;

type TimelineView = (typeof viewOptions)[number];

type TimelineFormState = {
  title: string;
  description: string;
  notes: string;
  startDate: string;
  endDate: string;
  status: TimelineMilestone["status"];
  priority: TimelineMilestone["priority"];
  assignedTo: string;
  attachedLinks: string;
  progress: number;
  color: string;
};

const emptyForm: TimelineFormState = {
  title: "",
  description: "",
  notes: "",
  startDate: "",
  endDate: "",
  status: "Not Started",
  priority: "Medium",
  assignedTo: "",
  attachedLinks: "",
  progress: 0,
  color: "#2563eb",
};

function getStatusClasses(status: TimelineMilestone["status"]) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "In Progress":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "On Hold":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Delayed":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function getPriorityClasses(priority: TimelineMilestone["priority"]) {
  switch (priority) {
    case "Critical":
      return "bg-rose-100 text-rose-700";
    case "High":
      return "bg-orange-100 text-orange-700";
    case "Low":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-sky-100 text-sky-700";
  }
}

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

export function TimelineManagement() {
  const { userProfile } = useAuth();
  const [milestones, setMilestones] = useState<TimelineMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<TimelineView>("vertical");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TimelineMilestone["status"]>("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | TimelineMilestone["priority"]>("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("manual");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineMilestone | null>(null);
  const [form, setForm] = useState<TimelineFormState>(emptyForm);

  useEffect(() => {
    const unsubscribe = subscribeToTimelines((items) => {
      setMilestones(items);
      setLoading(false);
    }, userProfile);
    return () => unsubscribe();
  }, [userProfile]);

  const filteredMilestones = useMemo(() => {
    const filtered = milestones.filter((item) => {
      const haystack = `${item.title} ${item.description ?? ""} ${item.assignedToName ?? ""}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || item.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === "All" || item.assignedTo === assigneeFilter || item.assignedToName === assigneeFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "startDate") return (a.startDate ?? "").localeCompare(b.startDate ?? "");
      if (sortBy === "endDate") return (a.endDate ?? "").localeCompare(b.endDate ?? "");
      if (sortBy === "priority") {
        const map = { Low: 1, Medium: 2, High: 3, Critical: 4 } as const;
        return map[b.priority] - map[a.priority];
      }
      return (a.order ?? 999) - (b.order ?? 999);
    });
  }, [milestones, search, statusFilter, priorityFilter, assigneeFilter, sortBy]);

  const overview = useMemo(() => {
    const completed = milestones.filter((item) => item.status === "Completed").length;
    const upcoming = milestones.filter((item) => item.status !== "Completed" && item.status !== "In Progress").length;
    const overdue = milestones.filter((item) => {
      if (!item.endDate || item.status === "Completed") return false;
      const end = new Date(`${item.endDate}T00:00:00`);
      const today = new Date();
      return end < today;
    }).length;
    const total = milestones.length;
    const overallProgress = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, upcoming, overdue, overallProgress };
  }, [milestones]);

  const assigneeOptions = useMemo(() => {
    const values = new Set<string>(milestones.map((item) => item.assignedToName).filter((name): name is string => Boolean(name)));
    return Array.from(values);
  }, [milestones]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (item: TimelineMilestone) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      notes: item.notes ?? "",
      startDate: item.startDate ?? "",
      endDate: item.endDate ?? "",
      status: item.status,
      priority: item.priority,
      assignedTo: item.assignedTo ?? "",
      attachedLinks: item.attachments?.join("\n") ?? "",
      progress: item.progress,
      color: item.color ?? "#2563eb",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    const attachments = form.attachedLinks
      .split("\n")
      .map((link) => link.trim())
      .filter(Boolean);

    const payload = {
      title: form.title,
      description: form.description,
      notes: form.notes,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      priority: form.priority,
      assignedTo: form.assignedTo,
      assignedToName: form.assignedTo,
      progress: form.progress,
      color: form.color,
      attachments,
      organizationId: userProfile.organizationId ?? "",
      teamId: userProfile.teamId ?? "",
    };

    if (editing) {
      await updateTimelineMilestone(editing.id, payload);
    } else {
      await createTimelineMilestone(payload, userProfile as User);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      await deleteTimelineMilestone(id);
    }
  };

  const handleDuplicate = async (item: TimelineMilestone) => {
    await duplicateTimelineMilestone(item, userProfile as User);
  };

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredMilestones.findIndex((item) => item.id === active.id);
    const newIndex = filteredMilestones.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const updated = arrayMove(filteredMilestones, oldIndex, newIndex);
    await reorderTimelineMilestones(updated);
  };

  const toggleComplete = async (item: TimelineMilestone) => {
    await updateTimelineMilestone(item.id, { 
      status: item.status === "Completed" ? "In Progress" : "Completed", 
      progress: item.status === "Completed" ? item.progress : 100 
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total milestones", value: overview.total, accent: "bg-slate-50 text-slate-700" },
          { label: "Completed", value: overview.completed, accent: "bg-emerald-50 text-emerald-700" },
          { label: "Upcoming", value: overview.upcoming, accent: "bg-sky-50 text-sky-700" },
          { label: "Overdue", value: overview.overdue, accent: "bg-rose-50 text-rose-700" },
          { label: "Progress", value: `${overview.overallProgress}%`, accent: "bg-violet-50 text-violet-700" },
        ].map((item) => (
          <Card key={item.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.accent}`}>{item.label}</div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-500" />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search milestones" 
              className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" 
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | TimelineMilestone["status"])}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All status</SelectItem>
                {statusOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as "All" | TimelineMilestone["priority"])}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All priority</SelectItem>
                {priorityOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All assignees</SelectItem>
                {assigneeOptions.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="startDate">Start date</SelectItem>
                <SelectItem value="endDate">End date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openNewDialog} className="gap-2"><Plus className="h-4 w-4" /> New milestone</Button>
          </div>
        </CardContent>
      </Card>

      {/* View Toggles */}
      <div className="flex flex-wrap gap-2">
        {viewOptions.map((option) => (
          <Button 
            key={option} 
            variant={view === option ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView(option)}
          >
            {option === "vertical" ? <GitBranch className="mr-2 h-4 w-4" /> : 
             option === "roadmap" ? <LayoutGrid className="mr-2 h-4 w-4" /> : 
             option === "list" ? <List className="mr-2 h-4 w-4" /> : 
             <CalendarDays className="mr-2 h-4 w-4" />} 
            {option[0].toUpperCase() + option.slice(1)}
          </Button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-center gap-3 p-8 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading milestones…
          </CardContent>
        </Card>
      ) : filteredMilestones.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center text-slate-600">
            <Sparkles className="h-8 w-8 text-sky-500" />
            <p className="text-lg font-semibold text-slate-900">No milestones yet</p>
            <p>Create your first milestone to start tracking the project journey.</p>
            <Button onClick={openNewDialog}>Create milestone</Button>
          </CardContent>
        </Card>
      ) : view === "vertical" ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredMilestones.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {filteredMilestones.map((item) => (
                <SortableMilestoneCard 
                  key={item.id} 
                  item={item} 
                  onEdit={openEditDialog} 
                  onDuplicate={handleDuplicate} 
                  onDelete={handleDelete} 
                  onToggleComplete={toggleComplete} 
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : view === "roadmap" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredMilestones.map((item) => (
            <Card key={item.id} className="border-slate-200 shadow-sm">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color ?? "#2563eb" }} />
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  </div>
                  <Badge className={getStatusClasses(item.status)}>{item.status}</Badge>
                </div>
                <p className="text-sm text-slate-600">{item.description || "No description yet."}</p>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${item.progress}%`, backgroundColor: item.color ?? "#2563eb" }} />
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{formatDate(item.startDate)}</span>
                  <span>{formatDate(item.endDate)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : view === "list" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filteredMilestones.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusClasses(item.status)}>{item.status}</Badge>
                  <Badge className={getPriorityClasses(item.priority)}>{item.priority}</Badge>
                </div>
                <h3 className="mt-2 font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.assignedToName || "Unassigned"}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 text-sm text-slate-600">
            Calendar view is ready for your team's scheduling layer and can be extended with a calendar widget next.
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(isOpen) => { setDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit milestone" : "Create milestone"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Progress</Label>
                <Input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as TimelineMilestone["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as TimelineMilestone["priority"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} placeholder="Team member name" />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Reference links</Label>
                <Textarea value={form.attachedLinks} onChange={(e) => setForm({ ...form, attachedLinks: e.target.value })} placeholder="Paste one link per line" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save milestone</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortableMilestoneCard({
  item,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleComplete,
}: {
  item: TimelineMilestone;
  onEdit: (item: TimelineMilestone) => void;
  onDuplicate: (item: TimelineMilestone) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (item: TimelineMilestone) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style} 
      layout 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={`relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${isDragging ? 'z-50 ring-2 ring-blue-500 shadow-lg' : ''}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
        {/* Drag Handle */}
        <div className="flex items-start sm:items-center">
          <div 
            className="flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:cursor-grabbing" 
            {...attributes} 
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusClasses(item.status)}>{item.status}</Badge>
                <Badge className={getPriorityClasses(item.priority)}>{item.priority}</Badge>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 break-words">{item.title}</h3>
            </div>
            <div className="text-sm text-slate-500 whitespace-nowrap">
              {formatDate(item.startDate)} → {formatDate(item.endDate)}
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-600 break-words">{item.description || "No description yet."}</p>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full transition-all" style={{ width: `${item.progress}%`, backgroundColor: item.color ?? "#2563eb" }} />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> {item.progress}%</span>
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {item.assignedToName || "Unassigned"}</span>
          </div>

          {/* Buttons - Now with proper wrapping and visibility */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => onToggleComplete(item)} className="shrink-0">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {item.status === "Completed" ? "Reopen" : "Complete"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(item)} className="shrink-0">
              <PencilLine className="mr-2 h-4 w-4" />Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDuplicate(item)} className="shrink-0">
              <Copy className="mr-2 h-4 w-4" />Duplicate
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(item.id)} className="shrink-0">
              <Trash2 className="mr-2 h-4 w-4" />Delete
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}