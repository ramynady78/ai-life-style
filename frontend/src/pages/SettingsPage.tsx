import { useEffect, useMemo, useState } from "react";
import { Camera, Save, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { SidebarLayout } from "@/components/SidebarLayout";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout, refreshUser } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("General");
  const tabs = ["General", "Notifications", "Privacy", "Account"];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const isDark = resolvedTheme === "dark";

  const fullName = useMemo(
    () => [firstName, lastName].filter(Boolean).join(" ").trim(),
    [firstName, lastName],
  );
  const initials = useMemo(() => (firstName?.[0] ?? "U").toUpperCase(), [firstName]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [userResponse, profileResponse] = await Promise.all([
          api.getCurrentUser(),
          api.getProfile().catch(() => null),
        ]);

        if (!isMounted) return;

        setFirstName(userResponse.first_name ?? "");
        setLastName(userResponse.last_name ?? "");
        setEmail(userResponse.email ?? "");
        setUsername(userResponse.username ?? "");

        if (profileResponse?.profile?.gym_days_per_week) {
          setDaysPerWeek(profileResponse.profile.gym_days_per_week);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message ?? "Unable to load settings");
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

  const handleThemeToggle = (enabled: boolean) => {
    setTheme(enabled ? "dark" : "light");
  };

  const handleSaveGeneral = async () => {
    setError("");
    setIsSavingGeneral(true);

    try {
      await api.updateCurrentUser({
        first_name: firstName,
        last_name: lastName,
        email,
        username,
      });

      await api.updateProfile({
        gym_days_per_week: daysPerWeek,
      });
      await refreshUser();

      toast({
        title: "Settings updated",
        description: "Account and profile settings were saved.",
      });
    } catch (err: any) {
      setError(err.message ?? "Unable to save settings");
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleUpdatePassword = async () => {
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await api.changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "Password updated",
        description: response.message,
      });
    } catch (err: any) {
      setError(err.message ?? "Unable to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your account permanently? This action cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    setError("");
    setIsDeletingAccount(true);

    try {
      await api.deleteCurrentUser();
      logout();
      toast({
        title: "Account deleted",
        description: "Your account and related data were removed.",
      });
      navigate("/signup", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Unable to delete account");
      setIsDeletingAccount(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await api.logout();
    } catch {
      // local logout should still happen if backend call fails
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <SidebarLayout className="p-4 sm:p-8 max-w-4xl">
      <div className="mb-8 animate-in fade-in duration-500">
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and app preferences.
        </p>
      </div>

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

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
          Loading settings...
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === "General" && (
            <div className="p-6 md:p-8 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-foreground mb-4">Profile Information</h3>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted relative group cursor-pointer overflow-hidden">
                      <div className="w-full h-full bg-emerald-500 text-white flex items-center justify-center text-3xl font-bold">
                        {initials}
                      </div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary cursor-default">
                      Avatar sync coming soon
                    </span>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-border" />

              <section>
                <h3 className="text-lg font-bold text-foreground mb-4">App Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Language</label>
                    <select className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none">
                      <option>English (US)</option>
                      <option>Russian</option>
                      <option>Arabic</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Units of Measurement</label>
                    <select className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none">
                      <option>Metric (kg, cm, L)</option>
                      <option>Imperial (lbs, in, oz)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Timezone</label>
                    <select className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none">
                      <option>Pacific Time (PT)</option>
                      <option>Eastern Time (ET)</option>
                      <option>Central Time (CT)</option>
                    </select>
                  </div>

                  <div className="space-y-2 flex flex-col justify-center">
                    <label className="text-sm font-semibold text-foreground">Dark Mode</label>
                    <label className="relative inline-flex items-center cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isDark}
                        onChange={(e) => handleThemeToggle(e.target.checked)}
                      />
                      <div className="relative w-14 h-7 rounded-full transition-colors duration-300 bg-gray-200 dark:bg-gray-300 peer-checked:bg-primary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 after:content-[''] after:absolute after:top-1/2 after:left-[2px] after:-translate-y-1/2 after:h-6 after:w-6 after:rounded-full after:bg-white after:border after:border-white after:transition-all after:duration-300 peer-checked:after:translate-x-7 peer-checked:after:bg-slate-900 peer-checked:after:border-slate-900" />
                    </label>
                  </div>
                </div>
              </section>

              <hr className="border-border" />

              <section>
                <h3 className="text-lg font-bold text-foreground mb-4">Goal Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Weekly Workouts
                    </label>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Target sessions per week</span>
                        <span className="text-sm font-bold text-accent">{daysPerWeek} days</span>
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
                  </div>
                </div>
              </section>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSaveGeneral}
                  disabled={isSavingGeneral}
                  className="flex items-center gap-2 bg-accent text-accent-foreground px-8 py-3 rounded-xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60"
                >
                  <Save className="w-5 h-5" /> {isSavingGeneral ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "Notifications" && (
            <div className="p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold text-foreground mb-2">Notification Preferences</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Notification toggles are currently local UI state only.
              </p>
            </div>
          )}

          {activeTab === "Privacy" && (
            <div className="p-6 md:p-8 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-foreground mb-4">Data & Privacy</h3>
                <p className="text-sm text-muted-foreground">
                  Privacy preferences are visible here, while account deletion is fully wired.
                </p>
              </section>

              <section>
                <div className="border-2 border-red-200 bg-red-50 p-6 rounded-2xl dark:bg-red-950/20 dark:border-red-900/50">
                  <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-2 dark:text-red-500">
                    <AlertTriangle className="w-5 h-5" /> Danger Zone
                  </h3>
                  <p className="text-sm text-red-600 mb-4 dark:text-red-400">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    type="button"
                    disabled={isDeletingAccount}
                    onClick={handleDeleteAccount}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm transition-colors disabled:opacity-60"
                  >
                    {isDeletingAccount ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeTab === "Account" && (
            <div className="p-6 md:p-8 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-foreground mb-4">Connected Accounts</h3>
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
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-foreground mb-4">Change Password</h3>
                <div className="space-y-4 max-w-md">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={isUpdatingPassword}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </section>

              <section className="pt-4 border-t border-border">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-6 py-3 border border-border bg-white text-foreground hover:bg-muted rounded-xl font-bold transition-colors w-full sm:w-auto"
                  >
                    Sign Out
                  </button>
                  <span className="text-sm text-muted-foreground">{fullName || "Account"}</span>
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </SidebarLayout>
  );
}
