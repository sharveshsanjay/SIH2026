import { useMemo, useState } from "react";
import { Users, Github, Linkedin, Globe, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/shared/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { SafeAvatar } from "@/components/shared/SafeAvatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/PageSkeleton";
import { useCollection } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firebase";
import { User } from "@/types";
import { openUrl } from "@/lib/url-utils";
import { paginate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 9;

export default function TeamPage() {
  const { data: users, loading } = useCollection<User>(COLLECTIONS.users);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = (search || "").toString().toLowerCase();
    return users.filter((u) => {
      const fullName = u.fullName?.toString().toLowerCase() ?? "";
      const email = u.email?.toString().toLowerCase() ?? "";
      const department = u.department?.toString().toLowerCase() ?? "";
      const matchSearch =
        fullName.includes(q) ||
        email.includes(q) ||
        department.includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = paginate(filtered, page, PAGE_SIZE);

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "away": return "warning";
      default: return "secondary";
    }
  };

  if (loading) return <CardGridSkeleton />;

  return (
    <PageTransition>
      <PageHeader
        title="Team Members"
        description="View and connect with your hackathon team"
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by name, email, department..."
          className="sm:max-w-xs"
        />
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="team_member">Team Member</SelectItem>
            <SelectItem value="mentor">Mentor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members found"
          description="Team members will appear here once added by the admin."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map((member) => (
              <Card key={member.id} className="hover:shadow-card transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <SafeAvatar
                      src={member.profilePhotoUrl}
                      name={member.fullName}
                      className="h-14 w-14"
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{member.fullName}</CardTitle>
                      <p className="text-sm text-muted-foreground truncate">{member.role === "admin" ? "Admin" : member.role === "mentor" ? "Mentor" : "Team Member"}</p>
                      <Badge variant={statusColor(member.status) as "success" | "warning" | "secondary"} className="mt-1 text-[10px]">
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {member.department && (
                    <p className="text-sm text-muted-foreground">{member.department} · {member.college}</p>
                  )}
                  {member.skills && member.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {member.skills.slice(0, 6).map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  )}
                  {member.currentTask && (
                    <p className="text-xs text-muted-foreground">
                      Current: <span className="text-foreground">{member.currentTask}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-1 pt-1">
                    {member.email && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openUrl(`mailto:${member.email}`)}>
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {member.phoneNumber && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openUrl(`tel:${member.phoneNumber}`)}>
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {member.githubUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openUrl(member.githubUrl!)}>
                        <Github className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {member.linkedinUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openUrl(member.linkedinUrl!)}>
                        <Linkedin className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {member.portfolioUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openUrl(member.portfolioUrl!)}>
                        <Globe className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
        </>
      )}
    </PageTransition>
  );
}
