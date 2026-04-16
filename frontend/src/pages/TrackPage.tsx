import { useEffect, useState } from "react";
import { Save, CheckCircle } from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { api, type AdherenceLog, type Measurement } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function TrackPage() {
  const [completionPct, setCompletionPct] = useState(85);
  const [completedAll, setCompletedAll] = useState(true);
  const [weightKg, setWeightKg] = useState("70.5");
  const [stepsAvg, setStepsAvg] = useState("8000");
  const [heartRate, setHeartRate] = useState("72");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadLatestData() {
      try {
        const [measurements, adherenceLogs] = await Promise.all([
          api.listMeasurements(),
          api.listAdherenceLogs(),
        ]);

        if (!isMounted) return;

        const latestMeasurement = measurements[measurements.length - 1] as Measurement | undefined;
        const latestAdherence = adherenceLogs[adherenceLogs.length - 1] as AdherenceLog | undefined;

        if (latestMeasurement) {
          setWeightKg(String(latestMeasurement.weight_kg ?? ""));
          setStepsAvg(String(latestMeasurement.steps_avg ?? ""));
          }

        if (latestAdherence) {
          setCompletionPct(latestAdherence.completion_pct ?? 0);
          setCompletedAll(latestAdherence.workout_done);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message ?? "Unable to load latest tracking data");
        }
      }
    }

    loadLatestData();

    return () => {
      isMounted = false;
    };
  }, []);

const handleSave = async () => {
  setIsSaving(true);
  setError("");

  try {
    const today = new Date().toISOString().slice(0, 10);

    const adherenceResponse = await api.createAdherenceLog({
      logDate: today,
      workoutDone: completedAll,
      completionPct,
      comment: notes || null,
    });

    toast({
      title: "Progress saved",
      description: "Your adherence log has been saved successfully.",
    });
  } catch (err: any) {
    setError(err.message ?? "Unable to save progress");
  } finally {
    setIsSaving(false);
  }
};

  return (
    <SidebarLayout className="p-4 sm:p-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
          Weekly Check-in
        </h1>
        <span className="px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm font-bold text-primary shadow-sm">
          Live Tracking
        </span>
      </div>

      <div className="max-w-2xl mx-auto bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-bold text-primary tracking-tight mb-4">
            Physiological Measurements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-primary tracking-tight">
                Current Weight (kg)
              </label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                step="0.1"
                className="w-full px-4 py-2.5 bg-background border-2 border-border rounded-xl focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all font-medium text-primary tracking-tight"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-primary tracking-tight">
                Average Steps
              </label>
              <input
                type="number"
                value={stepsAvg}
                onChange={(e) => setStepsAvg(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border-2 border-border rounded-xl focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all font-medium text-primary tracking-tight"
              />
            </div>
            
          </div>
        </div>

        <hr className="border-border my-8" />

        <div className="mb-6">
          <h3 className="text-lg font-bold text-primary tracking-tight mb-4">
            Workout Adherence
          </h3>

          <div className="bg-background border border-border rounded-xl p-5 mb-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-primary tracking-tight">
                Completed all scheduled sessions?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This is saved to the backend and used for plan adjustments.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={completedAll}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setCompletedAll(checked);
                  setCompletionPct(checked ? 100 : 0);
                }}
              />
              <div className="w-14 h-7 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          <div className="space-y-3 px-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-primary tracking-tight">
                Completion Percentage
              </label>
              <span className="text-lg font-bold text-primary tracking-tight">
                {completionPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={completionPct}
              onChange={(e) => setCompletionPct(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-accent"
              style={{
                background: `linear-gradient(to right, #10b981 ${completionPct}%, #e5e7eb ${completionPct}%)`,
              }}
            />
          </div>
        </div>

        <hr className="border-border my-8" />

        <div className="mb-8">
          <label className="block text-lg font-bold text-primary tracking-tight mb-4">
            Notes / How did you feel?
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all min-h-[120px] resize-y placeholder:text-muted-foreground/70"
            placeholder="Notes stay on this device for now. Backend support exists for measurements and adherence."
          ></textarea>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60"
          >
            {isSaving ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {isSaving ? "Saving..." : "Save Progress"}
          </button>
        </div>
      </div>
    </SidebarLayout>
  );
}
