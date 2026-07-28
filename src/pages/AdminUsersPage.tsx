import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageTransition } from "@/components/shared/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { SafeAvatar } from "@/components/shared/SafeAvatar";
import { TableSkeleton } from "@/components/shared/PageSkeleton";
import { useCollection } from "@/hooks/useCollection";
import { COLLECTIONS, db } from "@/lib/firebase";
import { User, UserRole } from "@/types";
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc, getFirestore } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "sonner";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export default function AdminUsersPage() {
  const { data: users, loading } = useCollection<User>(COLLECTIONS.users);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "team_member" as UserRole,
    profilePhotoUrl: "",
    phoneNumber: "",
    department: "",
    college: "",
    skills: "",
  });

  const filtered = useMemo(() =>
    users.filter((u) => {
      const q = (search || "").toString().toLowerCase();
      const full = (u.fullName || "").toString().toLowerCase();
      const email = (u.email || "").toString().toLowerCase();
      return full.includes(q) || email.includes(q);
    }), [users, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ email: "", password: "", fullName: "", role: "team_member", profilePhotoUrl: "", phoneNumber: "", department: "", college: "", skills: "" });
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingId(u.id);
    setForm({
      email: u.email,
      password: "",
      fullName: u.fullName,
      role: u.role,
      profilePhotoUrl: u.profilePhotoUrl || "",
      phoneNumber: u.phoneNumber || "",
      department: u.department || "",
      college: u.college || "",
      skills: (u.skills || []).join(", "),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.email) {
      toast.error("Name and email are required");
      return;
    }

    const profileData = {
      email: form.email,
      fullName: form.fullName,
      role: form.role,
      profilePhotoUrl: form.profilePhotoUrl,
      phoneNumber: form.phoneNumber,
      department: form.department,
      college: form.college,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      status: "offline" as const,
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, COLLECTIONS.users, editingId), profileData);
      await logActivity("User Updated", { email: form.email });
      toast.success("User updated");
    } else {
      if (!form.password || form.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      const secondaryApp = initializeApp(firebaseConfig, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
        const secondaryDb = getFirestore(secondaryApp);
        // Create the Firestore user document using the secondary app so the new user
        // (who is signed in on the secondary app) creates their own profile.
        await setDoc(doc(secondaryDb, COLLECTIONS.users, cred.user.uid), {
          uid: cred.user.uid,
          email: form.email,
          fullName: form.fullName,
          name: form.fullName,
          role: form.role,
          profilePhotoUrl: form.profilePhotoUrl,
          phoneNumber: form.phoneNumber,
          department: form.department,
          college: form.college,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          status: "offline",
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await logActivity("User Created", { email: form.email, role: form.role });
        toast.success("User created successfully");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create user");
        return;
      } finally {
        await deleteApp(secondaryApp);
      }
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, COLLECTIONS.users, deleteId));
    await logActivity("User Deleted", { userId: deleteId });
    toast.success("User profile deleted. Remove from Firebase Auth console if needed.");
    setDeleteId(null);
  };

  if (loading) return <TableSkeleton />;

  return (
    <PageTransition>
      <PageHeader title="Manage Users" description="Create, edit, and assign roles to team members" action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Create User</Button>} />
      <SearchInput value={search} onChange={setSearch} placeholder="Search users..." className="mb-6 max-w-sm" />
      <div className="space-y-3">
        {filtered.map((u) => (
          <Card key={u.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <SafeAvatar src={u.profilePhotoUrl} name={u.fullName} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{u.fullName}</p>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                    {u.role === "admin" ? "Admin" : "Team Member"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(u.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit User" : "Create User"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Role</Label><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="team_member">Team Member</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editingId} /></div>
            {!editingId && <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" /></div>}
            <div className="space-y-2"><Label>Profile Photo URL</Label><Input value={form.profilePhotoUrl} onChange={(e) => setForm({ ...form, profilePhotoUrl: e.target.value })} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></div>
              <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>College</Label><Input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} /></div>
            <div className="space-y-2"><Label>Skills (comma separated)</Label><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full">{editingId ? "Update" : "Create"} User</Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete user profile?</AlertDialogTitle><AlertDialogDescription>Firestore profile will be deleted. Also remove the user from Firebase Authentication console.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
