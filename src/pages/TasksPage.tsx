import { useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, Calendar, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageTransition } from "@/components/shared/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { SafeAvatar } from "@/components/shared/SafeAvatar";
import { UrlActions } from "@/components/shared/UrlActions";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { useCollection } from "@/hooks/useCollection";
import { useAuth } from "@/contexts/AuthContext";
import { COLLECTIONS, db } from "@/lib/firebase";
import { Task, User, TASK_STATUSES, TASK_PRIORITIES, TaskStatus } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { logActivity, createNotification } from "@/lib/activity-logger";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const emptyTask = {
  title: "",
  description: "",
  assignedTo: "",
  deadline: "",
  priority: "medium" as const,
  estimatedHours: 0,
  status: "todo" as TaskStatus,
  attachmentUrl: "",
};

function TaskCard({ task, users, onEdit }: { task: Task; users: User[]; onEdit: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const assignee = users.find((u) => u.id === task.assignedTo);
  const priority = TASK_PRIORITIES.find((p) => p.value === task.priority);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border p-3 shadow-soft cursor-pointer hover:shadow-card transition-all",
        task.status === "todo" && "bg-red-50 border-red-200",
        task.status === "in_progress" && "bg-blue-50 border-blue-200",
        task.status === "review" && "bg-yellow-50 border-yellow-200",
        task.status === "completed" && "bg-green-50 border-green-200"
      )}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {priority && (
              <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-medium", priority.color)}>
                {priority.label}
              </span>
            )}
            {task.deadline && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(task.deadline)}
              </span>
            )}
            {task.attachmentUrl && <Paperclip className="h-3 w-3 text-muted-foreground" />}
          </div>
          {assignee && (
            <div className="flex items-center gap-2 mt-2">
              <SafeAvatar src={assignee.profilePhotoUrl} name={assignee.fullName} className="h-6 w-6" />
              <span className="text-xs text-muted-foreground">{assignee.fullName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const { data: tasks, loading } = useCollection<Task>(COLLECTIONS.tasks);
  const { data: users } = useCollection<User>(COLLECTIONS.users);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptyTask>(emptyTask);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const filtered = useMemo(() => {
    if (!search) return tasks;
    const q = (search || "").toString().toLowerCase();
    return tasks.filter(
      (t) =>
        (t.title || "").toString().toLowerCase().includes(q) ||
        (t.description || "").toString().toLowerCase().includes(q) ||
        (t.assignedToName || "").toString().toLowerCase().includes(q)
    );
  }, [tasks, search]);

  const columns = useMemo(() => {
    const cols: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      completed: [],
    };
    filtered.forEach((t) => cols[t.status]?.push(t));
    Object.keys(cols).forEach((k) => {
      cols[k as TaskStatus].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    return cols;
  }, [filtered]);

  const openCreate = (status: TaskStatus = "todo") => {
    setForm({ ...emptyTask, status });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setForm({
      title: task.title,
      description: task.description || "",
      assignedTo: task.assignedTo || "",
      deadline: task.deadline || "",
      priority: task.priority as typeof emptyTask.priority,
      estimatedHours: task.estimatedHours || 0,
      status: task.status,
      attachmentUrl: task.attachmentUrl || "",
    });
    setEditingId(task.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const assignee = users.find((u) => u.id === form.assignedTo);
    const data = {
      ...form,
      assignedToName: assignee?.fullName || "",
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, COLLECTIONS.tasks, editingId), data);
      await logActivity("Task Updated", { taskId: editingId, title: form.title });
      if (form.assignedTo) {
        await createNotification(form.assignedTo, "task_updated", "Task Updated", `"${form.title}" was updated`);
      }
      toast.success("Task updated");
    } else {
      const colTasks = tasks.filter((t) => t.status === form.status);
      const ref = await addDoc(collection(db, COLLECTIONS.tasks), {
        ...data,
        order: colTasks.length,
        createdAt: serverTimestamp(),
      });
      await logActivity("Task Created", { taskId: ref.id, title: form.title });
      if (form.assignedTo) {
        await createNotification(form.assignedTo, "new_task", "New Task Assigned", `You were assigned: "${form.title}"`);
      }
      toast.success("Task created");
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, COLLECTIONS.tasks, deleteId));
    await logActivity("Task Deleted", { taskId: deleteId });
    toast.success("Task deleted");
    setDeleteId(null);
    setDialogOpen(false);
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const overStatus = TASK_STATUSES.some((s) => s.value === over.id)
      ? (over.id as TaskStatus)
      : undefined;
    const overTask = tasks.find((t) => t.id === over.id);

    const targetStatus = overStatus ?? overTask?.status ?? task.status;
    const targetTasks = tasks.filter((t) => t.status === targetStatus).sort((a, b) => (a.order || 0) - (b.order || 0));

    if (targetStatus === task.status && overTask) {
      const oldIndex = targetTasks.findIndex((t) => t.id === taskId);
      const newIndex = targetTasks.findIndex((t) => t.id === overTask.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const updatedTasks = [...targetTasks];
      const [moved] = updatedTasks.splice(oldIndex, 1);
      updatedTasks.splice(newIndex, 0, moved);

      await Promise.all(
        updatedTasks.map((t, index) =>
          updateDoc(doc(db, COLLECTIONS.tasks, t.id), {
            order: index,
            updatedAt: serverTimestamp(),
          })
        )
      );
      await logActivity("Task Reordered", { taskId, status: targetStatus });
      return;
    }

    const newOrder = targetTasks.length;
    await updateDoc(doc(db, COLLECTIONS.tasks, taskId), {
      status: targetStatus,
      order: newOrder,
      updatedAt: serverTimestamp(),
    });
    await logActivity("Task Updated", { taskId, status: targetStatus });
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  if (loading) return <PageSkeleton />;

  return (
    <PageTransition>
      <PageHeader
        title="Task Board"
        description="Kanban board for team task management"
        action={<Button onClick={() => openCreate()}><Plus className="h-4 w-4" /> New Task</Button>}
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search tasks..."
        className="mb-6 max-w-sm"
      />

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {TASK_STATUSES.map(({ value, label }) => (
            <Card key={value} className="bg-gray-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <Badge variant="secondary">{columns[value].length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <SortableContext items={columns[value].map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <ColumnDroppable id={value}>
                    {columns[value].map((task) => (
                      <TaskCard key={task.id} task={task} users={users} onEdit={openEdit} />
                    ))}
                  </ColumnDroppable>
                </SortableContext>
                <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground" onClick={() => openCreate(value)}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <div className="rounded-lg border bg-white p-3 shadow-card opacity-90">
              <p className="text-sm font-medium">{activeTask.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Task" : "Create Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as typeof form.priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
                  <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input type="number" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Attachment URL</Label>
              <Input value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} placeholder="https://drive.google.com/..." />
              {form.attachmentUrl && <UrlActions url={form.attachmentUrl} />}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">{editingId ? "Update" : "Create"}</Button>
              {editingId && isAdmin && (
                <Button variant="destructive" onClick={() => setDeleteId(editingId)}>Delete</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}

function ColumnDroppable({
  id,
  children,
}: {
  id: TaskStatus;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "space-y-2 min-h-[100px] rounded-lg",
        isOver ? "bg-slate-100" : "bg-transparent"
      )}
    >
      {children}
    </div>
  );
}
