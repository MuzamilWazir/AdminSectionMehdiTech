import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  Settings,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

const allNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", access: "dashboard" },
  { to: "/subadmin", icon: Users, label: "Manage Subadmin", access: "admin" },
  { to: "/blogs", icon: FileText, label: "Blog Manager", access: "blogs" },
  { to: "/jobs", icon: Briefcase, label: "Job Posts", access: "jobs" },
  { to: "/applicants", icon: Users, label: "Applicants", access: "applicants" },
  { to: "/settings", icon: Settings, label: "Settings", access: "settings" },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { logout, tokens, user } = useAuth();
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const navItems = useMemo(() => {
    if (!user) return [];

    // Admin (role 1) can access all pages
    if (user.role === 1) {
      return allNavItems;
    }

    // Subadmin (role 2) can only access pages in their access_pages array
    return allNavItems.filter((item) => {
      if (item.access === "settings") {
        return true; // Always show dashboard and settings
      }
      return user.access_pages.includes(item.access);
    });
  }, [user]);

  const handleLogoutClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmLogout = async () => {
    setShowConfirmDialog(false);
    if (tokens?.refresh) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: tokens.refresh }),
        });
      } catch (error) {
        console.error("Logout API failed:", error);
      }
    }
    logout();
    navigate("/login");
  };

  const handleCancelLogout = () => {
    setShowConfirmDialog(false);
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-[#041431]   transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/** "flex flex-col border-r border-border bg-[#3F4D67]   transition-all duration-300", */}
      <div className="flex h-16 items-center justify-center border-b border-border px-4">
        <img
          src={!collapsed ? `/Logo.png` : `logo-first-character.png`}
          alt="Mehdi Technologies"
          className="h-8 w-auto"
        />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {/**navItems     ---Changes happenws here */}{" "}
        {allNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-white transition-colors hover:bg-accent hover:text-accent-foreground"
            activeClassName="bg-[#58C9EC] text-black-foreground  "
          >
            {/**bg-[#007BFF] text-primary-foreground hover:bg-primary hover:text-primary-foreground */}
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <button
          onClick={handleLogoutClick}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-white transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Logout
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out? You will need to sign in again
              to access the dashboard.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
