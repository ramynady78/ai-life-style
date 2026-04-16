import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { SidebarLayout } from "@/components/SidebarLayout";
import { api, type AdherenceLog, type Measurement, type Profile } from "@/lib/api";
import { calculateBmi, formatShortDate, formatWeekday } from "@/lib/health";

type PeriodOption = "This Week" | "This Month" | "Last 3 Months";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<PeriodOption>("This Week");
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [adherenceLogs, setAdherenceLogs] = useState<AdherenceLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
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

        if (!isMounted) return;

        setProfile(profileResponse.profile);
        setMeasurements(measurementsResponse);
        setAdherenceLogs(adherenceResponse);
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

  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((a, b) => a.measured_at.localeCompare(b.measured_at));
  }, [measurements]);

  const sortedAdherenceLogs = useMemo(() => {
    return [...adherenceLogs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  }, [adherenceLogs]);

  const filteredAdherenceLogs = useMemo(() => {
    if (period === "This Week") {
      return sortedAdherenceLogs.slice(-7);
    }

    if (period === "This Month") {
      return sortedAdherenceLogs.slice(-30);
    }

    return sortedAdherenceLogs.slice(-90);
  }, [sortedAdherenceLogs, period]);

  const filteredMeasurements = useMemo(() => {
    if (period === "This Week") {
      return sortedMeasurements.slice(-7);
    }

    if (period === "This Month") {
      return sortedMeasurements.slice(-30);
    }

    return sortedMeasurements.slice(-90);
  }, [sortedMeasurements, period]);

  const weeklyData = useMemo(() => {
    return filteredAdherenceLogs.map((log) => {
      const relatedMeasurement = [...filteredMeasurements]
        .reverse()
        .find((measurement) => measurement.measured_at === log.log_date);

      return {
        name: formatWeekday(log.log_date),
        date: log.log_date,
        completion: log.completion_pct ?? 0,
        steps: relatedMeasurement?.steps_avg ?? 0,
        comment: log.comment ?? "",
        workoutDone: log.workout_done ?? false,
      };
    });
  }, [filteredAdherenceLogs, filteredMeasurements]);

  const progressData = useMemo(() => {
    return filteredMeasurements.map((measurement) => ({
      date: formatShortDate(measurement.measured_at),
      weight: measurement.weight_kg ?? 0,
      bmi: calculateBmi(measurement.weight_kg ?? 0, profile?.height_cm),
    }));
  }, [filteredMeasurements, profile?.height_cm]);

  const averageCompletion = weeklyData.length
    ? Math.round(weeklyData.reduce((sum, item) => sum + item.completion, 0) / weeklyData.length)
    : 0;

  const averageSteps = weeklyData.length
    ? Math.round(weeklyData.reduce((sum, item) => sum + item.steps, 0) / weeklyData.length)
    : 0;

  const healthScore = {
    overall: Math.round((averageCompletion + Math.min(100, Math.round(averageSteps / 100))) / 2),
    adherence: averageCompletion,
    activity: Math.min(100, Math.round(averageSteps / 100)),
  };

  return (
    <SidebarLayout className="p-4 sm:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center animate-in fade-in duration-500">
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
          Analytics & Reports
        </h1>

        <div className="flex rounded-xl border border-border bg-muted p-1">
          {(["This Week", "This Month", "Last 3 Months"] as PeriodOption[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                period === p
                  ? "bg-white text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
          Loading analytics...
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
              <h3 className="mb-4 w-full text-left text-lg font-bold text-foreground">
                Overall Health Score
              </h3>

              <div className="relative mb-6 flex h-40 w-40 items-center justify-center">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    className="text-muted opacity-30"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    className="text-primary"
                    strokeWidth="8"
                    strokeDasharray="282.7"
                    strokeDashoffset={282.7 - (282.7 * healthScore.overall) / 100}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-foreground">
                    {healthScore.overall}
                  </span>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Out of 100
                  </span>
                </div>
              </div>

              <div className="w-full space-y-3">
                {[
                  { label: "Adherence", value: healthScore.adherence, color: "bg-emerald-500" },
                  { label: "Activity", value: healthScore.activity, color: "bg-blue-500" },
                ].map((score) => (
                  <div key={score.label}>
                    <div className="mb-1 flex justify-between text-xs font-bold text-foreground">
                      <span>{score.label}</span>
                      <span>{score.value}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${score.color}`}
                        style={{ width: `${score.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-2">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <h3 className="mb-1 text-xl font-bold text-foreground">{averageCompletion}%</h3>
                <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-orange-600">
                  Average adherence
                </p>
                <div className="w-full border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    Based on saved adherence logs from the backend
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-foreground">Live Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average steps</span>
                    <strong>{averageSteps}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Measurements logged</span>
                    <strong>{measurements.length}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Adherence logs</span>
                    <strong>{adherenceLogs.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="rounded-2xl border border-border bg-card p-5 pt-4 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-foreground">Completion Trend</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748B" }}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="completion" fill="#08B27A" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 pt-4 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-foreground">Weight & BMI Progress</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748B" }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748B" }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="weight"
                      name="Weight (kg)"
                      stroke="#1e293b"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bmi"
                      name="BMI"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="border-b border-border p-5">
              <h3 className="text-lg font-bold text-foreground">Detailed Log</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Completion</th>
                    <th className="px-6 py-4 font-semibold">Steps</th>
                    <th className="px-6 py-4 font-semibold">Comment</th>
                    <th className="px-6 py-4 font-semibold">Workout</th>
                  </tr>
                </thead>

                <tbody>
                  {weeklyData.map((day, idx) => (
                    <tr
                      key={`${day.date}-${idx}`}
                      className="border-b border-border/50 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-6 py-4 font-bold text-foreground">{formatShortDate(day.date)}</td>
                      <td className="px-6 py-4">{day.completion}%</td>
                      <td className="px-6 py-4">{day.steps || "-"}</td>
                      <td className="px-6 py-4">{day.comment || "-"}</td>
                      <td className="px-6 py-4">
                        {day.workoutDone ? (
                          <span className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                            Done ({day.completion}%)
                          </span>
                        ) : (
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500">
                            Not done ({day.completion}%)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {weeklyData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No analytics data available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </SidebarLayout>
  );
}