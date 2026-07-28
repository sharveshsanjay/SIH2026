import { useMemo, useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageTransition } from "@/components/shared/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { UrlActions } from "@/components/shared/UrlActions";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/PageSkeleton";
import { useCollection, orderBy } from "@/hooks/useCollection";
import { useAuth } from "@/contexts/AuthContext";
import { COLLECTIONS, db } from "@/lib/firebase";
import { ResearchLink } from "@/types";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { logActivity } from "@/lib/activity-logger";
import { paginate } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = ["Government Documents", "APIs", "Datasets", "GitHub Repositories", "Research Papers", "YouTube Tutorials", "Other"];
const PAGE_SIZE = 9;

export default function ResearchPage() {
  const { isAdmin } = useAuth();
  const { data: links, loading } = useCollection<ResearchLink>(COLLECTIONS.researchLinks, [orderBy("createdAt", "desc")]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", url: "", category: "APIs", tags: "" });

  const filtered = useMemo(() => {
    return links.filter((l) => {
      const q = (search || "").toString().toLowerCase();
      const matchSearch = (l.title || "").toString().toLowerCase().includes(q) || (l.description || "").toString().toLowerCase().includes(q) || l.tags?.some((t) => (t || "").toString().toLowerCase().includes(q));
      const matchCat = categoryFilter === "all" || l.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [links, search, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = paginate(filtered, page, PAGE_SIZE);

  const handleSave = async () => {
    if (!form.title || !form.url) { toast.error("Title and URL required"); return; }
    const data = { title: form.title, description: form.description, url: form.url, category: form.category, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean), createdAt: serverTimestamp() };
    if (editingId) {
      await updateDoc(doc(db, COLLECTIONS.researchLinks, editingId), data);
      toast.success("Link updated");
    } else {
      await addDoc(collection(db, COLLECTIONS.researchLinks), data);
      await logActivity("Research Link Added", { title: form.title });
      toast.success("Link added");
    }
    setDialogOpen(false);
  };

  if (loading) return <CardGridSkeleton />;

  return (
    <PageTransition>
      <PageHeader title="Research Library" description="Useful external resources and references" action={<Button onClick={() => { setEditingId(null); setForm({ title: "", description: "", url: "", category: "APIs", tags: "" }); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Add Link</Button>} />
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search research..." className="sm:max-w-xs" />
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {paginated.length === 0 ? (
        <EmptyState icon={BookOpen} title="No research links" description="Add useful resources for your team." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map((l) => (
              <Card key={l.id} className="flex h-full flex-col border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-snug">{l.title}</CardTitle>
                    <Badge variant="secondary" className="w-fit shrink-0 text-[10px]">{l.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                    <p className="text-sm leading-6 text-foreground/90 whitespace-pre-wrap">
                      {l.description || "No description provided for this resource yet."}
                    </p>
                  </div>
                  {l.tags && l.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {l.tags.map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto pt-1">
                    <UrlActions url={l.url} />
                  </div>
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => { setEditingId(l.id); setForm({ title: l.title, description: l.description || "", url: l.url, category: l.category, tags: (l.tags || []).join(", ") }); setDialogOpen(true); }}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(l.id)}>Delete</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
        </>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Research Link</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Category</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete link?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={async () => { if (deleteId) { await deleteDoc(doc(db, COLLECTIONS.researchLinks, deleteId)); toast.success("Deleted"); setDeleteId(null); } }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
