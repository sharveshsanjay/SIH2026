import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Megaphone, Smile } from "lucide-react";
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
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/PageSkeleton";
import { useCollection, orderBy } from "@/hooks/useCollection";
import { useAuth } from "@/contexts/AuthContext";
import { COLLECTIONS, db } from "@/lib/firebase";
import { Announcement, User } from "@/types";
import { 
  addDoc, 
  collection, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  updateDoc
} from "firebase/firestore";
import { logActivity, createNotification } from "@/lib/activity-logger";
import { formatDate, paginate } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Page constants and UI values
const PAGE_SIZE = 8;
const priorityVariant = { low: "secondary" as const, medium: "warning" as const, high: "destructive" as const };

// Available emoji reactions shown on each announcement card.
const AVAILABLE_REACTIONS = ["👍", "❤️", "🎉", "🔥", "👏", "🚀", "👀"];

// Reaction component with custom tooltip
const ReactionButton = ({ 
  emoji, 
  count, 
  isReacted, 
  onReact, 
  users
}: { 
  emoji: string; 
  count: number; 
  isReacted: boolean; 
  onReact: () => void; 
  users: string[];
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const displayNames = users.slice(0, 5);
  const hasMore = users.length > 5;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReact}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-all border",
          isReacted
            ? "bg-blue-100 border-blue-500 text-blue-700 shadow-sm"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
        )}
      >
        <span>{emoji}</span>
        {count > 0 && <span className="text-xs">{count}</span>}
      </motion.button>
      
      {showTooltip && users.length > 0 && (
        <div className="absolute z-50 px-3 py-2 bg-slate-900 text-white rounded-lg shadow-lg min-w-[120px] -top-2 left-1/2 -translate-x-1/2 -translate-y-full">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-slate-300">{emoji}</p>
            {displayNames.map((name, i) => (
              <p key={i} className="text-xs text-slate-200">{name}</p>
            ))}
            {hasMore && (
              <p className="text-xs text-slate-400">+{users.length - 5} more</p>
            )}
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

// Add reaction popover using custom implementation
const AddReactionPopover = ({ onSelect }: { onSelect: (emoji: string) => void }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-all border border-dashed border-slate-300 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-400"
      >
        <Smile className="h-3.5 w-3.5" />
        <span className="text-xs">Add Reaction</span>
      </motion.button>
      
      {open && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 p-2 min-w-[200px]"
          >
            <div className="flex gap-1 flex-wrap">
              {AVAILABLE_REACTIONS.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    onSelect(emoji);
                    setOpen(false);
                  }}
                  className="h-8 w-8 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center text-lg"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

// Announcement card with reactions
type ReactionMap = Record<string, string[]>;

const AnnouncementCard = ({ 
  announcement, 
  isAdmin, 
  onEdit, 
  onDelete,
  currentUserId,
  users
}: { 
  announcement: Announcement; 
  isAdmin: boolean; 
  onEdit: () => void; 
  onDelete: () => void;
  currentUserId: string;
  users: User[];
}) => {
  const [reactions, setReactions] = useState<ReactionMap>((announcement as Announcement & { reactions?: ReactionMap }).reactions || {});
  const [isUpdating, setIsUpdating] = useState(false);

  const handleReaction = useCallback(async (emoji: string) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const reactionRef = doc(db, COLLECTIONS.announcements, announcement.id);
      const currentReactions = reactions[emoji] || [];
      const hasReacted = currentReactions.includes(currentUserId);

      if (hasReacted) {
        const updatedReactions = {
          ...reactions,
          [emoji]: currentReactions.filter((id: string) => id !== currentUserId)
        };
        if (updatedReactions[emoji].length === 0) {
          delete updatedReactions[emoji];
        }
        setReactions(updatedReactions);
        await updateDoc(reactionRef, {
          reactions: updatedReactions
        });
      } else {
        const updatedReactions = {
          ...reactions,
          [emoji]: [...currentReactions, currentUserId]
        };
        setReactions(updatedReactions);
        await updateDoc(reactionRef, {
          reactions: updatedReactions
        });
      }
    } catch (error) {
      console.error("Failed to update reaction:", error);
      toast.error("Failed to update reaction");
      setReactions((announcement as Announcement & { reactions?: ReactionMap }).reactions || {});
    } finally {
      setIsUpdating(false);
    }
  }, [announcement.id, reactions, currentUserId, isUpdating]);

  const getReactionUsers = useCallback((userIds: string[]) => {
    return userIds.map(id => {
      const user = users.find(u => u.id === id || u.uid === id);
      return user?.fullName || user?.email || id;
    });
  }, [users]);

  const sortedReactions = useMemo(() => {
    return Object.entries(reactions)
      .filter(([_, userIds]) => userIds.length > 0)
      .sort(([, a], [, b]) => b.length - a.length) as [string, string[]][];
  }, [reactions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "hover:shadow-card transition-all border-l-4",
          announcement.priority === "low" && "bg-green-50/50 border-l-green-500",
          announcement.priority === "medium" && "bg-yellow-50/50 border-l-yellow-500",
          announcement.priority === "high" && "bg-red-50/50 border-l-red-500"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">{announcement.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {announcement.createdAt ? formatDate(announcement.createdAt) : ""}
              </p>
            </div>
            <Badge variant={priorityVariant[announcement.priority]}>
              {announcement.priority}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {announcement.description}
          </p>

          {/* Reactions Section */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {sortedReactions.map(([emoji, userIds]) => (
              <ReactionButton
                key={emoji}
                emoji={emoji}
                count={userIds.length}
                isReacted={userIds.includes(currentUserId)}
                onReact={() => handleReaction(emoji)}
                users={getReactionUsers(userIds)}
              />
            ))}

            {sortedReactions.length < AVAILABLE_REACTIONS.length && (
              <AddReactionPopover onSelect={handleReaction} />
            )}
          </div>

          {isAdmin && (
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function AnnouncementsPage() {
  const { isAdmin, userProfile } = useAuth();
  const { data: announcements, loading } = useCollection<Announcement>(
    COLLECTIONS.announcements, 
    [orderBy("createdAt", "desc")]
  );
  const { data: users } = useCollection<User>(COLLECTIONS.users);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ 
    title: "", 
    description: "", 
    priority: "medium" as "low" | "medium" | "high" 
  });

  const currentUserId = userProfile?.uid || userProfile?.id || "";

  const filtered = useMemo(() => {
    const q = (search || "").toString().toLowerCase();
    return announcements.filter((a) => 
      ((a.title || "").toString().toLowerCase().includes(q) || 
       (a.description || "").toString().toLowerCase().includes(q))
    );
  }, [announcements, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = paginate(filtered, page, PAGE_SIZE);

  const handleSave = async () => {
    if (!form.title || !form.description) { 
      toast.error("Title and description required"); 
      return; 
    }
    
    try {
      if (editingId) {
        await updateDoc(doc(db, COLLECTIONS.announcements, editingId), { 
          ...form, 
          updatedAt: serverTimestamp() 
        });
        toast.success("Announcement updated");
      } else {
        await addDoc(collection(db, COLLECTIONS.announcements), { 
          ...form, 
          createdAt: serverTimestamp(),
          reactions: {}
        });
        await logActivity("Announcement Published", { title: form.title });
        
        for (const u of users) {
          try {
            await createNotification(
              u.id, 
              "announcement", 
              "New Announcement", 
              form.title
            );
          } catch (e) {
            console.warn("Failed to create notification for", u.id, e);
          }
        }
        toast.success("Announcement published");
      }
    } catch (err) {
      console.error("Announcement save failed:", err);
      toast.error(err instanceof Error ? err.message : String(err));
    }
    setDialogOpen(false);
  };

  if (loading) return <TableSkeleton />;

  return (
    <PageTransition>
      <PageHeader 
        title="Announcements" 
        description="Team-wide updates and notices" 
        action={isAdmin && (
          <Button 
            onClick={() => { 
              setEditingId(null); 
              setForm({ title: "", description: "", priority: "medium" }); 
              setDialogOpen(true); 
            }}
          >
            <Plus className="h-4 w-4" /> New Announcement
          </Button>
        )} 
      />
      
      <SearchInput 
        value={search} 
        onChange={(v) => { setSearch(v); setPage(1); }} 
        placeholder="Search announcements..." 
        className="mb-6 max-w-sm" 
      />
      
      {paginated.length === 0 ? (
        <EmptyState 
          icon={Megaphone} 
          title="No announcements" 
          description="Important team updates will appear here." 
        />
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                users={users || []}
                onEdit={() => {
                  setEditingId(a.id);
                  setForm({ 
                    title: a.title, 
                    description: a.description, 
                    priority: a.priority 
                  });
                  setDialogOpen(true);
                }}
                onDelete={() => setDeleteId(a.id)}
              />
            ))}
          </div>
          <Pagination 
            page={page} 
            totalPages={totalPages} 
            onPageChange={setPage} 
            className="mt-6" 
          />
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "New"} Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                rows={4} 
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={form.priority} 
                onValueChange={(v) => setForm({ ...form, priority: v as typeof form.priority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">
              Publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. All reactions will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => { 
                if (deleteId) { 
                  await deleteDoc(doc(db, COLLECTIONS.announcements, deleteId)); 
                  toast.success("Deleted"); 
                  setDeleteId(null); 
                } 
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}