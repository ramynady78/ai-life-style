import { useState, ChangeEvent , useEffect} from "react";
import { Camera, Save, AlertTriangle } from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { api, type User } from "@/lib/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("General");
  const tabs = ["General", "Notifications", "Privacy", "Account"];
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const handleThemeToggle = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const isDark = document.documentElement.classList.contains("dark");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [userResponse] = await Promise.all([
          api.getCurrentUser(),
        ]);

        if (!isMounted) return;

        setUser(userResponse);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message ?? "Unable to load analytics");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <SidebarLayout className="p-4 sm:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 animate-in fade-in duration-500">
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and app preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-8 overflow-x-auto scrollbar-none animate-in fade-in duration-500">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* General Tab */}
        {activeTab === "General" && (
          <div className="p-6 md:p-8 space-y-8">
            {/* Profile Section */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">
                Profile Information
              </h3>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted relative group cursor-pointer overflow-hidden">
                    <div className="w-full h-full bg-emerald-500 text-white flex items-center justify-center text-3xl font-bold">
                      A
                    </div>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-primary cursor-pointer hover:underline">
                    Change Avatar
                  </span>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.first_name + " " + user?.last_name || ""}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email || ""}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      User Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.username || ""}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-border" />

            {/* Preferences Section */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">
                App Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Language
                  </label>
                  <select className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none">
                    <option>English (US)</option>
                    <option>Russian</option>
                    <option>Arabic</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Units of Measurement
                  </label>
                  <select className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none">
                    <option>Metric (kg, cm, L)</option>
                    <option>Imperial (lbs, in, oz)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Timezone
                  </label>
                  <select className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none">
                    <option>Pacific Time (PT)</option>
                    <option>Eastern Time (ET)</option>
                    <option>Central Time (CT)</option>
                  </select>
                </div>

                <div className="space-y-2 flex flex-col justify-center">
                  <label className="text-sm font-semibold text-foreground">
                    Dark Mode
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked={isDark}
                      onChange={handleThemeToggle}
                    />
                    <div
                      className="
    relative w-14 h-7 rounded-full transition-colors duration-300
    bg-gray-200 dark:bg-gray-300
    peer-checked:bg-primary
    peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20

    after:content-[''] after:absolute after:top-1/2 after:left-[2px]
    after:-translate-y-1/2 after:h-6 after:w-6 after:rounded-full
    after:bg-white after:border after:border-white
    after:transition-all after:duration-300

    peer-checked:after:translate-x-7
    peer-checked:after:bg-slate-900
peer-checked:after:border-slate-900te
  "
                    ></div>
                  </label>
                </div>
              </div>
            </section>

            <hr className="border-border" />

            {/* Goals Section */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">
                Goal Settings
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Current Goals
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium">
                      Fat Loss
                    </span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-sm font-medium">
                      Improve Sleep
                    </span>
                    <button className="px-3 py-1 bg-muted text-muted-foreground border border-border border-dashed rounded-full text-sm font-medium hover:text-foreground hover:border-muted-foreground transition-colors">
                      + Add Goal
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-sm font-semibold text-foreground">
                        Weekly Workouts
                      </label>
                      <span className="text-sm font-bold text-accent">
                        4 days
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="7"
                      value={daysPerWeek}
                      onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-accent"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--accent)) ${((daysPerWeek - 1) / 6) * 100}%, #e5e7eb ${((daysPerWeek - 1) / 6) * 100}%)`,
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      Daily Calorie Target (kcal)
                    </label>
                    <input
                      type="number"
                      defaultValue="2000"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-4">
              <button className="flex items-center gap-2 bg-accent text-accent-foreground px-8 py-3 rounded-xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <Save className="w-5 h-5" /> Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "Notifications" && (
          <div className="p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-foreground mb-2">
              Notification Preferences
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Choose what updates you want to receive.
            </p>

            <div className="space-y-4">
              {[
                {
                  title: "Push Notifications",
                  desc: "Receive alerts on your device.",
                  on: true,
                },
                {
                  title: "Email Weekly Reports",
                  desc: "Get a summary of your progress every Sunday.",
                  on: true,
                },
                {
                  title: "Workout Reminders",
                  desc: "Reminders 1 hour before scheduled sessions.",
                  on: true,
                },
                {
                  title: "Meal Plan Reminders",
                  desc: "Alerts for upcoming meal times.",
                  on: false,
                },
                {
                  title: "Achievement Alerts",
                  desc: "Notifications when you hit a milestone or streak.",
                  on: true,
                },
                {
                  title: "AI Insights",
                  desc: "Smart recommendations based on your data.",
                  on: true,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-background border border-border rounded-xl"
                >
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked={item.on}
                    />
                    <div
                      className="
      relative w-14 h-7 rounded-full transition-all duration-300
      bg-gray-200 peer-checked:bg-slate-900
      peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20

      after:content-[''] after:absolute after:top-1/2 after:left-[2px]
      after:-translate-y-1/2 after:h-6 after:w-6 after:rounded-full
      after:transition-all after:duration-300
      after:bg-white peer-checked:after:bg-gray-100
      after:border after:border-gray-300 peer-checked:after:border-slate-900

      peer-checked:after:translate-x-7
    "
                    ></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === "Privacy" && (
          <div className="p-6 md:p-8 space-y-8">
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">
                Data & Privacy
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      Share anonymous data
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Help improve LifeFit AI's models.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked={true}
                    />
                    <div
                      className="
    relative w-14 h-7 rounded-full transition-all duration-300
    bg-[#E5E7EB] peer-checked:bg-[#0F1E4A]
    after:content-[''] after:absolute after:top-1/2 after:left-[2px]
    after:-translate-y-1/2 after:h-6 after:w-6 after:rounded-full
    after:bg-white peer-checked:after:bg-white
    after:border after:border-[#D1D5DB] peer-checked:after:border-white
    after:transition-all after:duration-300
    peer-checked:after:translate-x-7
  "
                    ></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      Allow AI profile scanning
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Required for personalized recommendations.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked={true}
                      disabled
                    />
                    <div className="w-11 h-6 bg-primary opacity-50 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[22px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 cursor-not-allowed"></div>
                  </label>
                </div>
              </div>
            </section>

            <section>
              <div className="border-2 border-red-200 bg-red-50 p-6 rounded-2xl dark:bg-red-950/20 dark:border-red-900/50">
                <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-2 dark:text-red-500">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </h3>
                <p className="text-sm text-red-600 mb-4 dark:text-red-400">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
                <button className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm transition-colors">
                  Delete Account
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "Account" && (
          <div className="p-6 md:p-8 space-y-8">
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">
                Connected Accounts
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="font-bold text-gray-700">G</span>
                    </div>
                    <span className="font-bold text-sm">Google</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md">
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="font-bold text-gray-700">A</span>
                    </div>
                    <span className="font-bold text-sm">Apple</span>
                  </div>
                  <button className="text-xs font-bold text-primary hover:underline">
                    Connect
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">
                Change Password
              </h3>
              <div className="space-y-4 max-w-md">
                <input
                  type="password"
                  placeholder="Current Password"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors">
                  Update Password
                </button>
              </div>
            </section>

            <section className="pt-4 border-t border-border">
              <button className="px-6 py-3 border border-border bg-white text-foreground hover:bg-muted rounded-xl font-bold transition-colors w-full sm:w-auto">
                Sign Out
              </button>
            </section>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
