import { useEffect, useState } from "react";
import { Target, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageTransition } from "@/components/shared/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { UrlActions } from "@/components/shared/UrlActions";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { COLLECTIONS, db } from "@/lib/firebase";
import { ProblemStatement } from "@/types";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "sonner";

export default function ProblemStatementPage() {
  const { isAdmin } = useAuth();
  const [ps, setPs] = useState<ProblemStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Partial<ProblemStatement>>({});

  useEffect(() => {
    getDoc(doc(db, COLLECTIONS.problemStatements, "main")).then((snap) => {
      if (snap.exists()) {
        setPs({ id: snap.id, ...snap.data() } as ProblemStatement);
      }
      setLoading(false);
    });
  }, []);

  const openEdit = () => {
    setForm(ps || {});
    setEditOpen(true);
  };

  const handleSave = async () => {
    await setDoc(doc(db, COLLECTIONS.problemStatements, "main"), {
      ...form,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setPs({ id: "main", ...form } as ProblemStatement);
    await logActivity("Problem Statement Updated");
    toast.success("Problem statement saved");
    setEditOpen(false);
  };

  if (loading) return <PageSkeleton />;

  return (
    <PageTransition>
      <PageHeader
        title="Problem Statement"
        description="SIH 2026 project problem details and research"
        action={isAdmin && (
          <Button onClick={openEdit}>Edit Problem Statement</Button>
        )}
      />

      {!ps ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No problem statement configured yet.</p>
            {isAdmin && (
              <Button className="mt-4" onClick={openEdit}>Add Problem Statement</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Problem ID: {ps.problemId || "—"}</p>
                  <CardTitle className="mt-1">{ps.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ps.organization} · {ps.category}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {ps.description && (
                <Section title="Description" content={ps.description} />
              )}
              {ps.objectives && (
                <Section title="Objectives" content={ps.objectives} />
              )}
              {ps.constraints && (
                <Section title="Constraints" content={ps.constraints} />
              )}
              {ps.expectedOutput && (
                <Section title="Expected Output" content={ps.expectedOutput} />
              )}
              {ps.researchNotes && (
                <Section title="Research Notes" content={ps.researchNotes} />
              )}
            </CardContent>
          </Card>

          {(ps.importantLinks?.length || ps.referenceUrls?.length) ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Important Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...(ps.importantLinks || []), ...(ps.referenceUrls || [])].map((url, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm truncate flex-1 mr-4">{url}</span>
                    <UrlActions url={url} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Problem Statement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Problem ID</Label>
                <Input value={form.problemId || ""} onChange={(e) => setForm({ ...form, problemId: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Input value={form.organization || ""} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
            </div>
            {["description", "objectives", "constraints", "expectedOutput", "researchNotes"].map((field) => (
              <div key={field} className="space-y-2">
                <Label className="capitalize">{field.replace(/([A-Z])/g, " $1")}</Label>
                <Textarea
                  value={(form as Record<string, string>)[field] || ""}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  rows={3}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>Important Links (one per line)</Label>
              <Textarea
                value={(form.importantLinks || []).join("\n")}
                onChange={(e) => setForm({ ...form, importantLinks: e.target.value.split("\n").filter(Boolean) })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Reference URLs (one per line)</Label>
              <Textarea
                value={(form.referenceUrls || []).join("\n")}
                onChange={(e) => setForm({ ...form, referenceUrls: e.target.value.split("\n").filter(Boolean) })}
                rows={3}
              />
            </div>
            <Button onClick={handleSave} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
    </div>
  );
}
