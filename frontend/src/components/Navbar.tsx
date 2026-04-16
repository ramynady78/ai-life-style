import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  Home,
  User,
  ClipboardList,
  BarChart2,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();

  const navItems = [
    { to: "/home", icon: Home, label: "Home" },
    { to: "/profile", icon: User, label: "Profile" },
    { to: "/plan", icon: ClipboardList, label: "Plan" },
    { to: "/track", icon: Activity, label: "Track" },
    { to: "/dashboard", icon: BarChart2, label: "Dashboard" },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 h-16 bg-white border-b border-border shadow-sm z-50 px-4 md:px-8 flex items-center justify-between transition-all">
      <div className="flex items-center gap-4">
        <div
          onClick={() => navigate("/home")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-none tracking-tight">
              LifeFit AI
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase mt-0.5">
              GRADUATION PROJECT
            </span>
          </div>
        </div>

        <div className="hidden md:block w-px h-8 bg-border ml-2 mr-2"></div>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white border border-border shadow-sm text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:block w-px h-8 bg-border mr-2"></div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => {
            if (isAuthenticated) {
              logout();
            }
            navigate("/login");
          }}
          className="px-5 py-2 text-sm font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          {isAuthenticated ? "Sign Out" : "Sign In"}
        </button>
      </div>
    </nav>
  );
}
