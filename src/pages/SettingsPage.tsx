import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageTransition } from "@/components/shared/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { COLLECTIONS, db } from "@/lib/firebase";
import { PlatformSettings } from "@/types";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "sonner";

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    projectName: "SIH Team Workspace 2026",
    teamName: "",
    sihDeadline: "2026-09-30",
    description: "",
  });

  useEffect(() => {
    getDoc(doc(db, COLLECTIONS.settings, "platform")).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as PlatformSettings;
        setForm({
          projectName: data.projectName || "SIH Team Workspace 2026",
          teamName: data.teamName || "",
          sihDeadline: data.sihDeadline || "2026-09-30",
          description: data.description || "",
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await setDoc(doc(db, COLLECTIONS.settings, "platform"), {
      ...form,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await logActivity("Settings Updated");
    toast.success("Settings saved");
  };

  if (!isAdmin) {
    return (
      <PageTransition>
        <PageHeader title="Settings" description="Platform configuration" />
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Only admins can modify platform settings.
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader title="Settings" description="Configure platform settings and SIH deadline" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Platform Settings</CardTitle>
          <CardDescription>These settings affect the dashboard and team experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Project Name</Label><Input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} disabled={loading} /></div>
          <div className="space-y-2"><Label>Team Name</Label><Input value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} disabled={loading} /></div>
          <div className="space-y-2"><Label>SIH Deadline</Label><Input type="date" value={form.sihDeadline} onChange={(e) => setForm({ ...form, sihDeadline: e.target.value })} disabled={loading} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} disabled={loading} /></div>
          <Button onClick={handleSave} disabled={loading}>Save Settings</Button>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
