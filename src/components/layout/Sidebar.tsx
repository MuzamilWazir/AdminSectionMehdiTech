import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

const allNavItems = [
  {
    to: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["admin", "subadmin"],
  },
  { to: "/subadmin", icon: Users, label: "Manage Subadmin", roles: ["admin"] },
  {
    to: "/blogs",
    icon: FileText,
    label: "Blog Manager",
    roles: ["admin", "subadmin"],
  },
  {
    to: "/jobs",
    icon: Briefcase,
    label: "Job Posts",
    roles: ["admin", "subadmin"],
  },
  { to: "/applicants", icon: Users, label: "Applicants", roles: ["admin"] },
  {
    to: "/settings",
    icon: Settings,
    label: "Settings",
    roles: ["admin", "subadmin"],
  },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 🔐 Role-based filtering
  const navItems = useMemo(() => {
    if (!user) return [];
    return allNavItems.filter((item) => item.roles.includes(user.role));
  }, [user]);

  const handleLogoutClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmLogout = () => {
    setShowConfirmDialog(false);
    logout();
    navigate("/login");
  };

  const handleCancelLogout = () => {
    setShowConfirmDialog(false);
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-[#041431] transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-border px-4">
        <img
          src={!collapsed ? "/Logo.png" : "/logo-first-character.png"}
          alt="Logo"
          className="h-8 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-white transition-colors hover:bg-accent"
            activeClassName="bg-[#58C9EC] text-black"
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3">
        <button
          onClick={handleLogoutClick}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-white transition-colors hover:bg-accent"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
