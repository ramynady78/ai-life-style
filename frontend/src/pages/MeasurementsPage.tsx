import { useEffect, useMemo, useState } from "react";
import { Plus, Activity, HeartPulse } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SidebarLayout } from "@/components/SidebarLayout";
import { api, type Measurement, type Profile } from "@/lib/api";
import { calculateBmi, formatShortDate, getBmiCategory, measurementChartPoints } from "@/lib/health";
import { toast } from "@/hooks/use-toast";

export default function MeasurementsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weightKg, setWeightKg] = useState("");
  const [stepsAvg, setStepsAvg] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [sleepHoursAvg, setSleepHoursAvg] = useState("");
  const [measuredAt, setMeasuredAt] = useState(new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setError("");
    try {
      const [profileResponse, measurementsResponse] = await Promise.all([
        api.getProfile(),
        api.listMeasurements(),
      ]);
      setProfile(profileResponse.profile);
      setMeasurements(measurementsResponse);
    } catch (err: any) {
      setError(err.message ?? "Unable to load measurements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = useMemo(
    () => measurementChartPoints(measurements, profile?.height_cm),
    [measurements, profile?.height_cm],
  );

  const current = measurements[measurements.length - 1];
  const currentBmi = calculateBmi(current?.weight_kg, profile?.height_cm);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await api.createMeasurement({
        measuredAt,
        weightKg: weightKg ? Number(weightKg) : null,
        waistCm: waistCm ? Number(waistCm) : null,
        sleepHoursAvg: sleepHoursAvg ? Number(sleepHoursAvg) : null,
        stepsAvg: stepsAvg ? Number(stepsAvg) : null,
      });

      setMeasurements((prev) => [...prev, response.measurement]);
      setShowAddModal(false);
      setWeightKg("");
      setStepsAvg("");
      setWaistCm("");
      setSleepHoursAvg("");
      toast({
        title: "Measurement added",
        description: response.adjustment.reason,
      });
    } catch (err: any) {
      setError(err.message ?? "Unable to save measurement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SidebarLayout className="p-4 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">Body Measurements</h1>
          <p className="text-muted-foreground mt-1">Track your physical progress over time</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Add Measurement
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
          Loading measurements...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
              <p className="text-sm font-semibold text-muted-foreground mb-1">Current Weight</p>
              <h3 className="text-2xl font-bold text-foreground">{current?.weight_kg ?? "-"} kg</h3>
            </div>
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
              <p className="text-sm font-semibold text-muted-foreground mb-1">BMI</p>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-foreground">{currentBmi ?? "-"}</h3>
                {currentBmi && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold mb-1">
                    {getBmiCategory(currentBmi)}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
              <p className="text-sm font-semibold text-muted-foreground mb-1">Average Steps</p>
              <h3 className="text-2xl font-bold text-foreground">{current?.steps_avg ?? "-"}</h3>
            </div>
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
              <p className="text-sm font-semibold text-muted-foreground mb-1">Sleep Hours</p>
              <h3 className="text-2xl font-bold text-foreground">{current?.sleep_hours_avg ?? "-"} hrs</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="lg:col-span-1 bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col justify-center">
              <h3 className="text-lg font-bold text-foreground mb-6">BMI Indicator</h3>
              <div className="text-center mb-6">
                <span className="text-5xl font-extrabold text-primary">{currentBmi ?? "-"}</span>
              </div>

              <div className="text-center text-sm font-medium text-muted-foreground bg-muted p-3 rounded-xl border border-border">
                Height: {profile?.height_cm ?? "-"} cm <span className="mx-1 text-border">|</span> Weight: {current?.weight_kg ?? "-"} kg <br />
                <span className="text-emerald-600 font-bold mt-1 inline-block">
                  BMI Category: {getBmiCategory(currentBmi)}
                </span>
              </div>
            </div>

            <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">Measurement History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-border uppercase">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Weight</th>
                      <th className="px-6 py-4 font-semibold">BMI</th>
                      <th className="px-6 py-4 font-semibold">Steps</th>
                      <th className="px-6 py-4 font-semibold">Sleep Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...chartData].reverse().map((measurement) => (
                      <tr key={measurement.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{formatShortDate(measurement.measured_at)}</td>
                        <td className="px-6 py-4">{measurement.weight_kg ?? "-"} kg</td>
                        <td className="px-6 py-4">{measurement.bmi ?? "-"}</td>
                        <td className="px-6 py-4">{measurement.steps_avg ?? "-"}</td>
                        <td className="px-6 py-4">{measurement.sleep_hours_avg ?? "-"} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-card p-5 pt-4 rounded-2xl border border-border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6">Weight History</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Line type="monotone" dataKey="weight_kg" stroke="#08B27A" strokeWidth={3} dot={{ fill: "#08B27A", strokeWidth: 2, r: 4, stroke: "#fff" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card p-5 pt-4 rounded-2xl border border-border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6">Sleep Hours Trend</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Line type="monotone" dataKey="sleep_hours_avg" stroke="#3B82F6" strokeWidth={3} dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4, stroke: "#fff" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-xl font-bold text-foreground">Add Measurement</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Date</label>
                <input
                  type="date"
                  value={measuredAt}
                  onChange={(e) => setMeasuredAt(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Weight (kg)</label>
                  <input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} type="number" className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Average Steps</label>
                  <input value={stepsAvg} onChange={(e) => setStepsAvg(e.target.value)} type="number" className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Waist Circumference (cm)</label>
                  <input value={waistCm} onChange={(e) => setWaistCm(e.target.value)} type="number" className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Average Sleep Hours</label>
                  <input value={sleepHoursAvg} onChange={(e) => setSleepHoursAvg(e.target.value)} type="number" className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground py-3 rounded-xl font-bold shadow-sm transition-all disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Measurement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
