import { useEffect, useMemo, useState } from "react";
import {
  Target,
  CheckCircle,
  RefreshCw,
  Lightbulb,
  Footprints,
  Flame,
  HeartPulse,
  Scale,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SidebarLayout } from "@/components/SidebarLayout";
import {
  api,
  type ActiveRecommendation,
  type AdherenceLog,
  type Measurement,
  type Profile,
} from "@/lib/api";
import { calculateBmi, formatShortDate, measurementChartPoints, goalLabel } from "@/lib/health";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<ActiveRecommendation | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [adherenceLogs, setAdherenceLogs] = useState<AdherenceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [profileResponse, measurementsResponse, adherenceResponse] = await Promise.all([
          api.getProfile(),
          api.listMeasurements(),
          api.listAdherenceLogs(),
        ]);

        let activePlan: ActiveRecommendation | null = null;

        try {
          activePlan = await api.getActiveRecommendation();
        } catch {
          activePlan = null;
        }

        if (!isMounted) return;

        setProfile(profileResponse.profile);
        setMeasurements(measurementsResponse);
        setAdherenceLogs(adherenceResponse);
        setPlan(activePlan);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message ?? "Unable to load dashboard");
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

  const chartData = useMemo(
    () => measurementChartPoints(measurements, profile?.height_cm),
    [measurements, profile?.height_cm],
  );
  const latestMeasurement = measurements[measurements.length - 1];
  const latestBmi = calculateBmi(latestMeasurement?.weight_kg, profile?.height_cm);
  const adherenceAverage = adherenceLogs.length
    ? Math.round(
        adherenceLogs.reduce((sum, log) => sum + (log.completion_pct ?? 0), 0) /
          adherenceLogs.length,
      )
    : 0;
  const activeStreak = adherenceLogs
    .slice()
    .reverse()
    .findIndex((log) => !log.workout_done);
  const displayedStreak = activeStreak === -1 ? adherenceLogs.length : activeStreak;

  const habitItems = [
    {
      id: "weight",
      name: "Log Measurements",
      target: "Weekly check-in",
      completed: Boolean(latestMeasurement),
      streak: measurements.length,
      icon: Scale,
    },
    {
      id: "steps",
      name: "Step Goal",
      target: "8,000 steps",
      completed: (latestMeasurement?.steps_avg ?? 0) >= 8000,
      streak: Math.max(0, Math.round((latestMeasurement?.steps_avg ?? 0) / 2000)),
      icon: Footprints,
    },
    {
      id: "adherence",
      name: "Workout Completion",
      target: "Plan adherence",
      completed: adherenceAverage >= 80,
      streak: displayedStreak,
      icon: CheckCircle,
    },
    {
      id: "heart",
      name: "Heart Rate Check",
      target: "Log bpm",
      completed: latestMeasurement?.heart_rate != null,
      streak: measurements.filter((item) => item.heart_rate != null).length,
      icon: HeartPulse,
    },
  ];

  const weightTrend = chartData.map((item, index) => ({
    name: `W${index + 1}`,
    value: item.weight_kg,
  }));
  const bmiTrend = chartData.map((item, index) => ({
    name: `W${index + 1}`,
    value: item.bmi,
  }));
  const aiInsight =
    plan?.content.progress_summary ||
    plan?.content.adjustment_summary ||
    (latestBmi ? `BMI is ${latestBmi}` : "Add measurements to unlock insights");

  return (
    <SidebarLayout className="p-4 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight mb-2">
            Performance Overview
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-medium">
              Welcome back, {user?.first_name ?? "User"}
            </span>
            {plan && (
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                Plan version: v{plan.version}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Calories</span>
              </div>
              <span className="text-lg font-bold">{plan?.content.calorie_target ?? "-"} kcal/day</span>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weight</span>
              </div>
              <span className="text-lg font-bold">{latestMeasurement?.weight_kg ?? "-"} kg</span>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Footprints className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Steps</span>
              </div>
              <span className="text-lg font-bold">{latestMeasurement?.steps_avg ?? "-"} avg</span>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adherence</span>
              </div>
              <span className="text-lg font-bold">{adherenceAverage}%</span>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-600">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Live Habits</h3>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                {habitItems.filter((item) => item.completed).length}/{habitItems.length} completed
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {habitItems.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <button className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${habit.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground"}`}>
                      {habit.completed && <CheckCircle className="w-4 h-4" />}
                    </button>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${habit.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{habit.name}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{habit.target}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">
                    <Flame className="w-3 h-3" />
                    <span className="text-xs font-bold">{habit.streak}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-4 right-4 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Current Goal</p>
              <h3 className="text-2xl font-bold text-foreground mb-1">{goalLabel(profile?.goal_type)}</h3>
              <p className="text-xs font-medium text-emerald-600">Local AI plan target</p>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-4 right-4 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Plan Adherence</p>
              <h3 className="text-2xl font-bold text-foreground mb-1">{adherenceAverage}%</h3>
              <p className="text-xs font-medium text-muted-foreground">Based on saved weekly check-ins</p>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-4 right-4 w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <RefreshCw className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Plan Version</p>
              <h3 className="text-2xl font-bold text-foreground mb-1">{plan ? `v${plan.version}` : "-"}</h3>
              <p className="text-xs font-medium text-muted-foreground">
                {plan ? `Created ${formatShortDate(plan.created_at)}` : "Generate a plan from profile"}
              </p>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-4 right-4 w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lightbulb className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">AI Insight</p>
              <h3 className="text-[15px] leading-tight font-bold text-foreground pr-12 mb-2 mt-1">
                {aiInsight}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                Generated from the active local Ollama AI plan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-card p-5 pt-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Weight Trend</h3>
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Line type="monotone" dataKey="value" stroke="#08B27A" strokeWidth={3} dot={{ fill: "#08B27A", strokeWidth: 2, r: 4, stroke: "#fff" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card p-5 pt-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">BMI Trend</h3>
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bmiTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4, stroke: "#fff" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </SidebarLayout>
  );
}
