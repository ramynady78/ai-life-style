import { NavLink, useNavigate } from "react-router-dom";
import { 
  Activity, 
  Home, 
  User, 
  ClipboardList, 
  BarChart2,
  Ruler,
  Sparkles,
  UtensilsCrossed,
  TrendingUp,
  MessageSquare,
  Settings,
  Moon,
  Sun
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleDark = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const navSections = [
    {
      label: "MAIN",
      items: [
        { to: "/home", icon: Home, label: "Home" },
        { to: "/dashboard", icon: BarChart2, label: "Dashboard" },
      ]
    },
    {
      label: "HEALTH",
      items: [
        { to: "/profile", icon: User, label: "Profile" },
        { to: "/measurements", icon: Ruler, label: "Body Measurements" },
        { to: "/track", icon: Activity, label: "Progress Tracking" },
      ]
    },
    {
      label: "PLANNING",
      items: [
        { to: "/recommendations", icon: Sparkles, label: "AI Recommendations" },
        { to: "/plan", icon: ClipboardList, label: "Workout Plan" },
        { to: "/nutrition", icon: UtensilsCrossed, label: "Meal Plan" },
      ]
    },
    {
      label: "REPORTS",
      items: [
        { to: "/analytics", icon: TrendingUp, label: "Analytics" },
        { to: "/chat", icon: MessageSquare, label: "AI Coach Chat" },
      ]
    },
    {
      label: "ACCOUNT",
      items: [
        { to: "/settings", icon: Settings, label: "Settings" },
      ]
    }
  ];

  return (
    <div className="w-64 h-full bg-white border-r border-border flex flex-col z-40 dark:bg-card">
      {/* Logo */}
      <div className="p-6">
        <div 
          onClick={() => { navigate("/home"); onCloseMobile?.(); }} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 shrink-0">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-primary leading-none tracking-tight">LifeFit AI</span>
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase mt-0.5 whitespace-nowrap">GRADUATION PROJECT</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-2 pb-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-4 mb-2 mt-5">
              {section.label}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onCloseMobile?.()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-xs font-semibold text-muted-foreground">Theme</span>
          <button 
            onClick={toggleDark}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center gap-3 bg-muted p-3 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {user?.first_name?.[0] ?? "U"}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-foreground truncate">
              {user ? `${user.first_name} ${user.last_name}` : "User"}
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
                onCloseMobile?.();
              }}
              className="text-left text-xs text-emerald-600 font-medium hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
