import { useMemo, useState } from "react";
import { Plus, Calendar, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageTransition } from "@/components/shared/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/PageSkeleton";
import { openUrl } from "@/lib/url-utils";
import { useCollection, orderBy } from "@/hooks/useCollection";
import { useAuth } from "@/contexts/AuthContext";
import { COLLECTIONS, db } from "@/lib/firebase";
import { Meeting } from "@/types";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { logActivity, createNotification } from "@/lib/activity-logger";
import { formatDate, paginate } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 8;

export default function MeetingsPage() {
  const { isAdmin } = useAuth();
  const { data: meetings, loading } = useCollection<Meeting>(COLLECTIONS.meetings, [orderBy("date", "desc")]);
  const { data: users } = useCollection(COLLECTIONS.users);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", date: "", time: "", agenda: "", meetingLink: "", notes: "" });

  const filtered = useMemo(() => {
    const q = (search || "").toString().toLowerCase();
    return meetings.filter((m) => (m.title || "").toString().toLowerCase().includes(q));
  }, [meetings, search]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = paginate(filtered, page, PAGE_SIZE);

  const handleSave = async () => {
    if (!form.title || !form.date) { toast.error("Title and date required"); return; }
    const data = { ...form, updatedAt: serverTimestamp() };
    if (editingId) {
      await updateDoc(doc(db, COLLECTIONS.meetings, editingId), data);
      toast.success("Meeting updated");
    } else {
      await addDoc(collection(db, COLLECTIONS.meetings), { ...data, createdAt: serverTimestamp() });
      await logActivity("Meeting Scheduled", { title: form.title });
      for (const u of users) {
        await createNotification(u.id, "meeting_reminder", "New Meeting", `"${form.title}" on ${form.date}`, { meetingId: form.title });
      }
      toast.success("Meeting scheduled");
    }
    setDialogOpen(false);
  };

  if (loading) return <TableSkeleton />;

  return (
    <PageTransition>
      <PageHeader title="Meetings" description="Schedule and manage team meetings" action={isAdmin && <Button onClick={() => { setEditingId(null); setForm({ title: "", date: "", time: "", agenda: "", meetingLink: "", notes: "" }); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Schedule Meeting</Button>} />
      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search meetings..." className="mb-6 max-w-sm" />
      {paginated.length === 0 ? (
        <EmptyState icon={Calendar} title="No meetings" description="Schedule your first team meeting." />
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map((m) => {
              const isUpcoming = m.date >= new Date().toISOString().split("T")[0];
              return (
                <Card key={m.id} className="hover:shadow-card transition-shadow">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{m.title}</h3>
                        {isUpcoming && <Badge variant="success" className="text-[10px]">Upcoming</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{formatDate(m.date)} at {m.time || "TBD"}</p>
                      {m.agenda && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{m.agenda}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {m.meetingLink && (
                        <Button size="sm" onClick={() => openUrl(m.meetingLink!)}><Video className="h-4 w-4" /> Join</Button>
                      )}
                      {isAdmin && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => { setEditingId(m.id); setForm({ title: m.title, date: m.date, time: m.time, agenda: m.agenda || "", meetingLink: m.meetingLink || "", notes: m.notes || "" }); setDialogOpen(true); }}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(m.id)}>Delete</Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
        </>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingId ? "Edit" : "Schedule"} Meeting</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Time</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Agenda</Label><Textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} /></div>
            <div className="space-y-2"><Label>Meeting Link</Label><Input value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete meeting?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={async () => { if (deleteId) { await deleteDoc(doc(db, COLLECTIONS.meetings, deleteId)); toast.success("Deleted"); setDeleteId(null); } }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
