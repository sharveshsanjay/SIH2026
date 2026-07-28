import { useMemo, useState } from "react";
import { Plus, Lightbulb, ThumbsUp, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Idea } from "@/types";
import { addDoc, arrayUnion, arrayRemove, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { logActivity, createNotification } from "@/lib/activity-logger";
import { paginate } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 6;
const statusColors = { pending: "warning", approved: "success", rejected: "destructive" } as const;

export default function IdeasPage() {
  const { userProfile, isAdmin } = useAuth();
  const { data: ideas, loading } = useCollection<Idea>(COLLECTIONS.ideas, [orderBy("createdAt", "desc")]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", technologies: "", advantages: "", challenges: "", referenceUrl: "" });
  const profileId = (userProfile?.uid ?? userProfile?.id ?? "").toString();

  const filtered = useMemo(() => {
    const q = (search || "").toString().toLowerCase();
    return ideas.filter((i) => {
      const searchableText = [
        i.title,
        i.description,
        i.advantages,
        i.challenges,
        i.proposedByName,
        ...(i.technologies || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchSearch = searchableText.includes(q);
      const matchStatus = statusFilter === "all" || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [ideas, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = paginate(filtered, page, PAGE_SIZE);

  const handleSubmit = async () => {
    if (!userProfile) {
      toast.error("You must be signed in to submit an idea.");
      return;
    }
    if (!form.title) { toast.error("Title required"); return; }
    const profileId = userProfile.uid ?? userProfile.id;
    await addDoc(collection(db, COLLECTIONS.ideas), {
      title: form.title,
      description: form.description,
      proposedBy: profileId,
      proposedByName: userProfile.fullName || "",
      technologies: form.technologies.split(",").map((t) => t.trim()).filter(Boolean),
      advantages: form.advantages,
      challenges: form.challenges,
      referenceUrl: form.referenceUrl,
      votes: [],
      status: "pending",
      createdAt: serverTimestamp(),
    });
    await logActivity("Idea Submitted", { title: form.title });
    toast.success("Idea submitted");
    setDialogOpen(false);
    setForm({ title: "", description: "", technologies: "", advantages: "", challenges: "", referenceUrl: "" });
  };

  const toggleVote = async (idea: Idea) => {
    if (!userProfile) return;
    const profileId = userProfile.uid ?? userProfile.id;
    const voted = idea.votes.includes(profileId);
    await updateDoc(doc(db, COLLECTIONS.ideas, idea.id), {
      votes: voted ? arrayRemove(profileId) : arrayUnion(profileId),
    });
  };

  const updateStatus = async (idea: Idea, status: "approved" | "rejected") => {
    await updateDoc(doc(db, COLLECTIONS.ideas, idea.id), { status });
    await logActivity(`Idea ${status === "approved" ? "Approved" : "Rejected"}`, { title: idea.title });
    if (status === "approved" && idea.proposedBy) {
      await createNotification(idea.proposedBy, "idea_approved", "Idea Approved", `"${idea.title}" was approved!`);
    }
    toast.success(`Idea ${status}`);
  };

  if (loading) return <CardGridSkeleton />;

  return (
    <PageTransition>
      <PageHeader title="Idea Board" description="Brainstorm and vote on project ideas" action={<Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Submit Idea</Button>} />
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search ideas..." className="sm:max-w-xs" />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent>
        </Select>
      </div>
      {paginated.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No ideas yet" description="Be the first to submit a project idea." action={{ label: "Submit Idea", onClick: () => setDialogOpen(true) }} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {paginated.map((idea) => (
              <Card key={idea.id} className="flex h-full flex-col border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Badge variant={statusColors[idea.status]} className="w-fit capitalize">{idea.status}</Badge>
                      <CardTitle className="text-base leading-snug">{idea.title}</CardTitle>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">By {idea.proposedByName || "Unknown"}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                    <p className="text-sm leading-6 text-foreground/90 whitespace-pre-wrap">
                      {idea.description || "No detailed description provided yet."}
                    </p>
                  </div>

                  {idea.advantages && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Advantages</p>
                      <p className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">{idea.advantages}</p>
                    </div>
                  )}

                  {idea.challenges && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Challenges</p>
                      <p className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">{idea.challenges}</p>
                    </div>
                  )}

                  {idea.technologies && idea.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {idea.technologies.map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {idea.referenceUrl && <UrlActions url={idea.referenceUrl} />}

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVote(idea)}
                      className={idea.votes.includes(profileId) ? "border-primary text-primary" : ""}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" /> {idea.votes.length}
                    </Button>
                    {isAdmin && idea.status === "pending" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => updateStatus(idea, "approved")}><Check className="h-3.5 w-3.5" /> Approve</Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateStatus(idea, "rejected")}><X className="h-3.5 w-3.5" /> Reject</Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
        </>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Submit Idea</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Technologies (comma separated)</Label><Input value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} /></div>
            <div className="space-y-2"><Label>Advantages</Label><Textarea value={form.advantages} onChange={(e) => setForm({ ...form, advantages: e.target.value })} /></div>
            <div className="space-y-2"><Label>Challenges</Label><Textarea value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} /></div>
            <div className="space-y-2"><Label>Reference URL</Label><Input value={form.referenceUrl} onChange={(e) => setForm({ ...form, referenceUrl: e.target.value })} /></div>
            <Button onClick={handleSubmit} className="w-full">Submit Idea</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
