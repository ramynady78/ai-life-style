import { useEffect, useMemo, useState } from "react";
import { Activity, Play, RefreshCw } from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ApiError, type ActiveRecommendation } from "@/lib/api";
import { parseRoutine, parseWorkoutPlan } from "@/lib/health";
import { toast } from "@/hooks/use-toast";

function unwrapPlanContent(plan: ActiveRecommendation | null) {
  if (!plan) return null;
  const maybe = plan.content as any;
  // Backward compatible: older rows might store the flat plan directly.
  return maybe && typeof maybe === "object" && "content" in maybe ? (maybe.content as any) : maybe;
}

type SessionExercise = {
  name: string;
  sets: number | null;
  reps: string | null;
  restSeconds: number | null;
  notes: string | null;
};

type WorkoutSession = {
  key: string;
  title: string;
  subtitle: string;
  durationMinutes: number | null;
  exercises: SessionExercise[];
  lines: string[];
};

export default function PlanPage() {
  const [activeTab, setActiveTab] = useState<"workout" | "routine">("workout");
  const [plan, setPlan] = useState<ActiveRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const loadPlan = async () => {
    setError("");
    try {
      const response = await api.getActiveRecommendation();
      setPlan(response);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setPlan(null);
      } else {
        console.error("[PlanPage] loadPlan failed", err);
        setError(err instanceof Error ? err.message : "Unable to load plan");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleRegenerate = async () => {
    setIsRefreshing(true);
    setError("");

    try {
      const response = await api.generateRecommendationPlan();
      await loadPlan();
      toast({
        title: `Plan regenerated (v${response.version})`,
        description: "Your workout and daily routine are updated.",
      });
    } catch (err: any) {
      console.error("[PlanPage] regenerate failed", err);
      setError(err.message ?? "Unable to regenerate plan");
      toast({
        title: "Regeneration failed",
        description: err.message ?? "Unable to regenerate plan",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const planContent = unwrapPlanContent(plan);
  const workout = parseWorkoutPlan(planContent?.workout_plan);
  const routine = parseRoutine(planContent?.daily_routine);
  const trainingDays = planContent?.training_days ?? null;
  const adherenceLevel = planContent?.adherence_level ?? null;
  const personalizationFactors = planContent?.personalization_factors ?? null;
  const nextWeekFocus = planContent?.next_week_focus ?? null;
  const safetyNotes = Array.isArray(planContent?.safety_notes) ? planContent.safety_notes : [];

  const hasAnyPlanDetails =
    Boolean(planContent?.workout_plan) ||
    (Array.isArray(trainingDays) && trainingDays.length > 0) ||
    Boolean(planContent?.daily_routine);

  const sessions: WorkoutSession[] = useMemo(() => {
    if (Array.isArray(trainingDays) && trainingDays.length > 0) {
      return trainingDays
        .map((day: any) => {
          const exercises: SessionExercise[] =
            Array.isArray(day?.exercises) && day.exercises.length > 0
              ? day.exercises.map((ex: any) => ({
                  name: String(ex?.name ?? "Exercise"),
                  sets: typeof ex?.sets === "number" ? ex.sets : null,
                  reps: typeof ex?.reps === "string" ? ex.reps : null,
                  restSeconds: typeof ex?.rest_seconds === "number" ? ex.rest_seconds : null,
                  notes: typeof ex?.notes === "string" ? ex.notes : null,
                }))
              : [];

          const lines =
            exercises.length > 0
              ? exercises.map((ex) =>
                  `${ex.name}${ex.sets != null && ex.reps ? ` - ${ex.sets}x${ex.reps}` : ""}`.trim(),
                )
              : typeof day?.duration_minutes === "number"
                ? [`Duration: ${day.duration_minutes} min`]
                : [];

          return {
            key: `training-day-${String(day?.day ?? "")}`,
            title: `Day ${day.day}: ${day.focus}`,
            subtitle: "Generated training focus",
            durationMinutes: typeof day?.duration_minutes === "number" ? day.duration_minutes : null,
            exercises,
            lines,
          } satisfies WorkoutSession;
        })
        .filter(Boolean);
    }

    return workout.days.map(
      (day): WorkoutSession => ({
        key: `workout-day-${day.title}`,
        title: day.title,
        subtitle: "Generated training focus",
        durationMinutes: null,
        exercises: [],
        lines: day.details,
      }),
    );
  }, [trainingDays, workout.days]);

  const selectedSession = sessions.find((session) => session.key === selectedSessionKey) ?? null;

  if (isLoading) {
    return (
      <SidebarLayout className="p-4 sm:p-8">
        <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
          Loading your plan...
        </div>
      </SidebarLayout>
    );
  }

  const openSession = (key: string) => {
    setSelectedSessionKey(key);
    setIsSessionOpen(true);
    setSessionStartedAt(null);
  };

  const handleFinishSession = async () => {
    if (!sessionStartedAt) return;
    setIsFinishing(true);
    try {
      const todayIso = new Date().toISOString().slice(0, 10);
      await api.createAdherenceLog({
        logDate: todayIso,
        workoutDone: true,
        completionPct: 100,
        comment: selectedSession?.title ? `Completed: ${selectedSession.title}` : "Completed workout session",
      });
      toast({
        title: "Session logged",
        description: "Workout completion saved to your tracking logs.",
      });
      setIsSessionOpen(false);
      setSelectedSessionKey(null);
      setSessionStartedAt(null);
    } catch (err: any) {
      console.error("[PlanPage] finish session failed", err);
      toast({
        title: "Could not log session",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <SidebarLayout className="p-4 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
              Your Recommendations
            </h1>
            {plan && (
              <span className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full border border-border">
                Plan Version: v{plan.version}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Generated by local Ollama AI from your live profile and tracking data
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-muted p-1 rounded-xl border border-border self-start">
            <button
              type="button"
              onClick={() => setActiveTab("workout")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "workout"
                  ? "bg-white text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Workout Plan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("routine")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "routine"
                  ? "bg-white text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Daily Routine
            </button>
          </div>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Regenerate"}
          </button>
        </div>
      </div>

      {plan && (adherenceLevel || nextWeekFocus) && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-foreground">Personalization</h2>
              {adherenceLevel && (
                <span className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full border border-border">
                  Adherence: {adherenceLevel}
                </span>
              )}
            </div>
            {nextWeekFocus && <p className="text-sm text-muted-foreground">{nextWeekFocus}</p>}
          </div>

          {personalizationFactors && personalizationFactors.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {personalizationFactors.slice(0, 10).map((factor: string) => (
                <span
                  key={factor}
                  className="px-3 py-1 bg-primary/5 text-primary border border-primary/10 rounded-full text-xs font-semibold"
                >
                  {factor}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!plan ? (
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-2">No active plan found</h2>
          <p className="text-muted-foreground mb-6">
            Create or update your profile first, then generate a plan.
          </p>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRefreshing}
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            Generate Plan
          </button>
        </div>
      ) : !hasAnyPlanDetails ? (
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-2">Plan details unavailable</h2>
          <p className="text-muted-foreground mb-6">
            Your active plan is missing workout and routine details. Try regenerating.
          </p>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRefreshing}
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {isRefreshing ? "Refreshing..." : "Regenerate Plan"}
          </button>
        </div>
      ) : activeTab === "workout" ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          {workout.summary.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workout.summary.map((line) => (
                <div key={line} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    {line.split(":")[0]}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {line.split(":").slice(1).join(":").trim()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((day) => (
              <div
                key={day.key}
                className="bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-gradient-to-br from-[#08142F] to-[#1a2855] p-5 text-white">
                  <span className="inline-block px-2.5 py-0.5 bg-white/20 text-white text-xs font-semibold rounded-full mb-3">
                    Session
                  </span>
                  <h3 className="text-xl font-bold mb-1">{day.title}</h3>
                  <p className="text-sm text-white/70">{day.subtitle}</p>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <h4 className="text-xs font-bold text-emerald-600 tracking-wider uppercase">
                        Session Details
                      </h4>
                    </div>
                    <div className="space-y-4">
                      {day.lines.slice(0, 8).map((detail) => (
                        <div key={detail} className="flex gap-4 items-center">
                          <button
                            type="button"
                            aria-label="Open session details"
                            onClick={() => openSession(day.key)}
                            className="rounded-lg bg-gray-800 flex items-center justify-center w-16 h-16 min-w-16 shadow-inner hover:bg-gray-700 transition-colors group"
                          >
                            <Play className="w-6 h-6 text-white fill-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                          </button>
                          <div className="flex-1">
                            <h5 className="text-sm font-bold text-foreground leading-tight">
                              {detail}
                            </h5>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/5 text-primary border border-primary/10">
                                Recommended
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {day.lines.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          No session details available yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-border bg-gray-50/50">
                  <button
                    type="button"
                    onClick={() => openSession(day.key)}
                    className="w-full py-2.5 rounded-xl border border-border bg-white text-sm font-semibold text-primary shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
                  >
                    Start Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
          {routine.map((item) => (
            <div key={item.label} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{item.label}</h3>
              <p className="text-muted-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={isSessionOpen}
        onOpenChange={(open) => {
          setIsSessionOpen(open);
          if (!open) {
            setSelectedSessionKey(null);
            setSessionStartedAt(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSession?.title ?? "Workout Session"}</DialogTitle>
            <DialogDescription>
              {selectedSession?.durationMinutes != null
                ? `Estimated duration: ${selectedSession.durationMinutes} min`
                : "Use this checklist during your workout."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedSession?.exercises && selectedSession.exercises.length > 0 ? (
              <div className="space-y-2">
                {selectedSession.exercises.map((ex, idx) => (
                  <div key={`${ex.name}-${idx}`} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="font-semibold text-foreground">{ex.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {ex.sets != null && ex.reps ? `${ex.sets} sets × ${ex.reps}` : "Sets/reps not provided"}
                      {ex.restSeconds != null ? ` • Rest ${ex.restSeconds}s` : ""}
                    </div>
                    {ex.notes && <div className="mt-1 text-sm text-muted-foreground">{ex.notes}</div>}
                  </div>
                ))}
              </div>
            ) : selectedSession?.lines && selectedSession.lines.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                {selectedSession.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">No exercise details available for this session.</div>
            )}

            {safetyNotes.length > 0 && (
              <div className="rounded-xl border border-border p-4">
                <div className="text-sm font-bold text-foreground mb-2">Safety Notes</div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {safetyNotes.slice(0, 5).map((note: string, idx: number) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            {!sessionStartedAt ? (
              <button
                type="button"
                onClick={() => setSessionStartedAt(Date.now())}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Start Now
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishSession}
                disabled={isFinishing}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {isFinishing ? "Saving..." : "Finish & Log"}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
