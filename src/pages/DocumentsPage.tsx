import { useMemo, useState } from "react";
import { Plus, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Pagination } from "@/components/shared/Pagination";
import { UrlActions } from "@/components/shared/UrlActions";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/PageSkeleton";
import { detectUrlType, getUrlIcon, getUrlLabel } from "@/lib/url-utils";
import { useCollection, orderBy } from "@/hooks/useCollection";
import { useAuth } from "@/contexts/AuthContext";
import { COLLECTIONS, db } from "@/lib/firebase";
import { Document } from "@/types";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { logActivity } from "@/lib/activity-logger";
import { formatDate, paginate } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = ["PDF", "PPT", "DOCX", "XLSX", "Images", "Videos", "GitHub Repository", "Google Drive Folder", "Other"];
const PAGE_SIZE = 9;

export default function DocumentsPage() {
  const { userProfile, isAdmin } = useAuth();
  const { data: documents, loading } = useCollection<Document>(COLLECTIONS.documents, [orderBy("uploadDate", "desc")]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "PDF", description: "", documentUrl: "" });

  const filtered = useMemo(() => {
    const q = (search || "").toString().toLowerCase();
    return documents.filter((d) => {
      const name = (d.name || "").toString().toLowerCase();
      const desc = (d.description || "").toString().toLowerCase();
      const matchSearch = name.includes(q) || desc.includes(q);
      const matchCat = categoryFilter === "all" || d.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [documents, search, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = paginate(filtered, page, PAGE_SIZE);

  const openCreate = () => {
    setForm({ name: "", category: "PDF", description: "", documentUrl: "" });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (doc: Document) => {
    setForm({ name: doc.name, category: doc.category, description: doc.description || "", documentUrl: doc.documentUrl });
    setEditingId(doc.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.documentUrl) {
      toast.error("Name and URL are required");
      return;
    }
    const uploaderId = userProfile?.uid ?? userProfile?.id ?? "";
    const data = {
      ...form,
      uploadedBy: uploaderId,
      uploadedByName: userProfile?.fullName || "",
      uploadDate: serverTimestamp(),
    };
    if (editingId) {
      await updateDoc(doc(db, COLLECTIONS.documents, editingId), data);
      toast.success("Document updated");
    } else {
      await addDoc(collection(db, COLLECTIONS.documents), data);
      await logActivity("Document Added", { name: form.name });
      toast.success("Document added");
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, COLLECTIONS.documents, deleteId));
    await logActivity("Document Deleted", { documentId: deleteId });
    toast.success("Document deleted");
    setDeleteId(null);
  };

  if (loading) return <CardGridSkeleton />;

  return (
    <PageTransition>
      <PageHeader
        title="Documents"
        description="External document links — no file uploads"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Document</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search documents..." className="sm:max-w-xs" />
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {paginated.length === 0 ? (
        <EmptyState icon={FileText} title="No documents" description="Add document links from Google Drive, GitHub, or other sources." action={{ label: "Add Document", onClick: openCreate }} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map((d) => {
              const type = detectUrlType(d.documentUrl);
              const Icon = getUrlIcon(type);
              return (
                <Card key={d.id} className="hover:shadow-card transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{d.name}</CardTitle>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-[10px]">{d.category}</Badge>
                          <Badge variant="outline" className="text-[10px]">{getUrlLabel(type)}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {d.description && <p className="text-sm text-muted-foreground line-clamp-2">{d.description}</p>}
                    <p className="text-xs text-muted-foreground">
                      By {d.uploadedByName} · {d.uploadDate ? formatDate(d.uploadDate) : "—"}
                    </p>
                    <div className="flex gap-2">
                      <UrlActions url={d.documentUrl} showLabel={false} />
                      {(isAdmin || d.uploadedBy === (userProfile?.uid ?? userProfile?.id ?? "")) && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openEdit(d)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(d.id)}>Delete</Button>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Document" : "Add Document"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Document URL</Label>
              <Input value={form.documentUrl} onChange={(e) => setForm({ ...form, documentUrl: e.target.value })} placeholder="https://drive.google.com/..." />
              {form.documentUrl && <UrlActions url={form.documentUrl} />}
            </div>
            <Button onClick={handleSave} className="w-full">{editingId ? "Update" : "Add"} Document</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete document?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
