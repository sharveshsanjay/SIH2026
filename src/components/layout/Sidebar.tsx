import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Lightbulb,
  Calendar,
  Megaphone,
  GitBranch,
  BookOpen,
  MessageSquare,
  BarChart3,
  Activity,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/team", icon: Users, label: "Team" },
  { to: "/problem-statement", icon: Target, label: "Problem Statement" },
  { to: "/tasks", icon: ClipboardList, label: "Tasks" },
  { to: "/ideas", icon: Lightbulb, label: "Ideas" },
  { to: "/documents", icon: FileText, label: "Documents" },
  { to: "/research", icon: BookOpen, label: "Research" },
  { to: "/meetings", icon: Calendar, label: "Meetings" },
  { to: "/timeline", icon: GitBranch, label: "Timeline" },
  { to: "/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/chat", icon: MessageSquare, label: "Team Chat" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

const adminItems = [
  { to: "/admin/users", icon: Shield, label: "Manage Users" },
  { to: "/activity-logs", icon: Activity, label: "Activity Logs" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const linkClass = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
      isActive
        ? "bg-primary text-primary-foreground shadow-soft"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    );

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r bg-white transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOCuzHgCXlBsGLR4zFuT1kE9Ml-1WWsSW77TFpw_Fxz7X0WVkQE7m9ADQ&s=10"
                  alt="SIH Logo"
                  className="h-12 w-auto object-contain"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Team Workspace</span>
            <span className="text-xs text-muted-foreground">2026</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => linkClass(isActive || location.pathname.startsWith(to + "/"))}>
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="my-3 border-t" />
            {!collapsed && (
              <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Admin
              </p>
            )}
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => linkClass(isActive)}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
