import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Utensils,
  Dumbbell,
  Moon,
  Droplets,
  TrendingUp,
  Heart,
  ChevronRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  api,
  ApiError,
  type ActiveRecommendation,
  type Profile,
  type RecommendationCard,
} from "@/lib/api";
import { goalLabel, parseRoutine, parseWorkoutPlan } from "@/lib/health";
import { toast } from "@/hooks/use-toast";

const CANONICAL_CATEGORIES = ["Nutrition", "Workout", "Recovery", "Lifestyle"] as const;
type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];

function unwrapPlanContent(plan: ActiveRecommendation | null) {
  if (!plan) return null;
  const maybe = plan.content as any;
  // Backward compatible: older rows might store the flat plan directly.
  return maybe && typeof maybe === "object" && "content" in maybe ? (maybe.content as any) : maybe;
}

function coerceCategory(value: unknown): CanonicalCategory {
  if (typeof value !== "string") return "Lifestyle";
  const lowered = value.trim().toLowerCase();
  if (lowered === "nutrition") return "Nutrition";
  if (lowered === "workout" || lowered === "training") return "Workout";
  if (lowered === "recovery") return "Recovery";
  if (lowered === "lifestyle") return "Lifestyle";
  return "Lifestyle";
}

function coercePriority(value: unknown): RecommendationCard["priority"] {
  if (typeof value !== "string") return "Low";
  const lowered = value.trim().toLowerCase();
  if (lowered === "high") return "High";
  if (lowered === "medium") return "Medium";
  return "Low";
}

function buildCards(plan: ActiveRecommendation | null, profile: Profile | null): RecommendationCard[] {
  const planContent = unwrapPlanContent(plan);
  if (!planContent) return [];

  if (planContent.recommendation_cards && planContent.recommendation_cards.length > 0) {
    return planContent.recommendation_cards
      .filter(Boolean)
      .map((card: any, index) => ({
        id: String(card?.id ?? `${card?.category ?? "card"}-${index}`),
        category: coerceCategory(card?.category),
        priority: coercePriority(card?.priority),
        title: String(card?.title ?? "Recommendation"),
        description: String(card?.description ?? ""),
        action: String(card?.action ?? "Review plan"),
        icon: String(card?.icon ?? "activity"),
      }));
  }

  const workout = parseWorkoutPlan(planContent.workout_plan);
  const routine = parseRoutine(planContent.daily_routine);
  const calories = routine.find((item) => item.label.toLowerCase().includes("calories"));
  const hydration = routine.find((item) => item.label.toLowerCase().includes("hydration"));
  const sleep = routine.find((item) => item.label.toLowerCase().includes("sleep"));
  const steps = routine.find((item) => item.label.toLowerCase().includes("steps"));

  return [
    {
      id: "workout-focus",
      category: "Workout",
      priority: "High",
      title: `${goalLabel(profile?.goal_type)} Training Focus`,
      description: workout.summary.find((line) => line.startsWith("Focus:"))?.replace("Focus:", "").trim() ?? "Structured workout plan ready.",
      action: "Review workout split",
      icon: "dumbbell",
    },
    {
      id: "calories",
      category: "Nutrition",
      priority: "High",
      title: "Daily Calorie Target",
      description: calories?.value || `${planContent.calorie_target} kcal/day`,
      action: "View nutrition target",
      icon: "utensils",
    },
    {
      id: "hydration",
      category: "Lifestyle",
      priority: "Medium",
      title: "Hydration Goal",
      description: hydration?.value || "Stay consistent with your daily water target.",
      action: "Stay on track",
      icon: "droplets",
    },
    {
      id: "sleep",
      category: "Recovery",
      priority: "Medium",
      title: "Sleep & Recovery",
      description: sleep?.value || "Target 7-8 hours nightly for recovery.",
      action: "Improve recovery",
      icon: "moon",
    },
    {
      id: "steps",
      category: "Lifestyle",
      priority: "Low",
      title: "Daily Movement",
      description: steps?.value || "Aim for consistent daily movement.",
      action: "Hit your step goal",
      icon: "trending-up",
    },
    {
      id: "routine",
      category: "Nutrition",
      priority: "Low",
      title: "Protein & Meal Rhythm",
      description:
        routine.find((item) => item.label.toLowerCase().includes("protein"))?.value ??
        "Keep protein present in every main meal.",
      action: "Refine meal structure",
      icon: "heart",
    },
  ];
}

export default function RecommendationsPage() {
  const [filter, setFilter] = useState("All");
  const [plan, setPlan] = useState<ActiveRecommendation | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedRec, setSelectedRec] = useState<RecommendationCard | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const categories = ["All", "Nutrition", "Workout", "Recovery", "Lifestyle"];

  const loadData = async () => {
    setError("");
    try {
      const profileResponse = await api.getProfile();
      setProfile(profileResponse.profile);

      try {
        const activePlan = await api.getActiveRecommendation();
        setPlan(activePlan);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setPlan(null);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error("[RecommendationsPage] loadData failed", err);
      setError(err.message ?? "Unable to load recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const planContent = unwrapPlanContent(plan);
  const cards = useMemo(() => buildCards(plan, profile), [plan, profile]);
  const filteredRecs =
    filter === "All"
      ? cards
      : cards.filter((card) => card.category.toLowerCase() === filter.toLowerCase());
  const highPriorityRec = cards.find((card) => card.priority === "High");

  const openDetail = (rec: RecommendationCard) => {
    setSelectedRec(rec);
    setIsDetailOpen(true);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "utensils":
        return <Utensils className="w-6 h-6" />;
      case "dumbbell":
        return <Dumbbell className="w-6 h-6" />;
      case "moon":
        return <Moon className="w-6 h-6" />;
      case "droplets":
        return <Droplets className="w-6 h-6" />;
      case "trending-up":
        return <TrendingUp className="w-6 h-6" />;
      case "heart":
        return <Heart className="w-6 h-6" />;
      default:
        return <Activity className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Nutrition":
        return "text-emerald-700 bg-emerald-100 border-emerald-200";
      case "Workout":
        return "text-blue-700 bg-blue-100 border-blue-200";
      case "Recovery":
        return "text-purple-700 bg-purple-100 border-purple-200";
      case "Lifestyle":
        return "text-orange-700 bg-orange-100 border-orange-200";
      default:
        return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError("");

    try {
      const response = await api.generateRecommendationPlan();
      const activePlan = await api.getActiveRecommendation();
      setPlan(activePlan);
      toast({
        title: `Plan regenerated (v${response.version})`,
        description: "Recommendations updated from your latest profile.",
      });
    } catch (err: any) {
      console.error("[RecommendationsPage] regenerate failed", err);
      setError(err.message ?? "Unable to regenerate recommendations");
      toast({
        title: "Regeneration failed",
        description: err.message ?? "Unable to regenerate recommendations",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    const current = new Date();
    current.setDate(current.getDate() - current.getDay() + index + 1);
    const isWorkoutDay = index < Number(profile?.gym_days_per_week ?? 3);

    return {
      day: current.toLocaleDateString("en-US", { weekday: "short" }),
      date: current.toLocaleDateString("en-US", { day: "2-digit" }),
      items: isWorkoutDay ? ["workout", "nutrition"] : ["recovery"],
      today: index === Math.max(0, new Date().getDay() - 1),
    };
  });

  if (isLoading) {
    return (
      <SidebarLayout className="p-4 sm:p-8">
        <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
          Loading recommendations...
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout className="p-4 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
              AI Recommendations
            </h1>
            {plan && (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Plan v{plan.version}
              </span>
            )}
          </div>
          <p className="text-muted-foreground font-medium">
            Personalized by local Ollama AI from your profile and tracking data
          </p>
          {planContent?.adherence_level && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full border border-border">
                Adherence: {planContent.adherence_level}
              </span>
              {planContent.next_week_focus && (
                <span className="px-3 py-1 bg-primary/5 text-primary text-xs font-semibold rounded-full border border-primary/10">
                  {planContent.next_week_focus}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing || !profile}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Regenerate"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!plan ? (
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-2">No active recommendation yet</h2>
          <p className="text-muted-foreground mb-6">
            Save your profile first, then generate your first personalized plan.
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || !profile}
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            Generate Recommendation Plan
          </button>
        </div>
      ) : (
        <>
          {highPriorityRec && (
            <div className="w-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 md:p-8 mb-8 text-white shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative z-10 md:w-2/3">
                <span className="inline-block px-3 py-1 bg-black/20 rounded-full text-xs font-bold tracking-wider uppercase mb-4 backdrop-blur-sm">
                  High Priority
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
                  {highPriorityRec.title}
                </h2>
                <p className="text-white/90 mb-6 text-lg">
                  {highPriorityRec.description}
                </p>
                <button
                  type="button"
                  onClick={() => openDetail(highPriorityRec)}
                  className="px-6 py-2.5 bg-white text-orange-600 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  {highPriorityRec.action} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex overflow-x-auto pb-2 scrollbar-none gap-2 mb-6 animate-in fade-in duration-700">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
                  filter === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {filteredRecs.map((rec) => (
              <div
                key={rec.id}
                className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 flex flex-col group"
              >
                <div className="flex justify-between items-start mb-5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(rec.category).split(" ")[1]}`}
                  >
                    <div className={getCategoryColor(rec.category).split(" ")[0]}>
                      {getIcon(rec.icon)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCategoryColor(rec.category)}`}
                    >
                      {rec.category}
                    </span>
                    {rec.priority === "High" && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {rec.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                  {rec.description}
                </p>

                <button
                  type="button"
                  onClick={() => openDetail(rec)}
                  className="w-full py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  {rec.action}
                </button>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden animate-in fade-in duration-1000">
            <div className="p-5 border-b border-border bg-muted/30">
              <h3 className="text-lg font-bold text-foreground">
                Weekly Activity Outlook
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-7 gap-2 md:gap-4">
                {weekDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-colors ${day.today ? "bg-primary border-primary shadow-md" : "bg-background border-border"}`}
                  >
                    <span className={`text-xs font-bold mb-1 ${day.today ? "text-primary-foreground/80" : "text-muted-foreground uppercase"}`}>
                      {day.day}
                    </span>
                    <span className={`text-lg font-extrabold mb-3 ${day.today ? "text-white" : "text-foreground"}`}>
                      {day.date}
                    </span>
                    <div className="flex flex-col gap-1.5 w-full">
                      {day.items.map((item, i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-full rounded-full ${
                            item === "workout"
                              ? "bg-blue-500"
                              : item === "nutrition"
                                ? "bg-emerald-500"
                                : item === "recovery"
                                  ? "bg-purple-500"
                                  : "bg-orange-500"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedRec(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>{selectedRec?.title ?? "Recommendation"}</span>
              {selectedRec?.category && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCategoryColor(selectedRec.category)}`}
                >
                  {selectedRec.category}
                </span>
              )}
            </DialogTitle>
            {selectedRec?.description && (
              <DialogDescription>{selectedRec.description}</DialogDescription>
            )}
          </DialogHeader>

          {!plan ? (
            <div className="text-sm text-muted-foreground">
              No active plan data available.
            </div>
          ) : (
            <div className="space-y-5">
              {selectedRec?.category === "Nutrition" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="text-xs font-semibold text-muted-foreground">
                        Daily Calories
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {typeof planContent?.calorie_target === "number"
                          ? `${planContent.calorie_target} kcal`
                          : "Not available"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="text-xs font-semibold text-muted-foreground">
                        Hydration Goal
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {typeof planContent?.hydration_goal_liters === "number"
                          ? `${planContent.hydration_goal_liters} L`
                          : "Not available"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="text-sm font-bold text-foreground mb-2">
                      Macro Targets
                    </div>
                    {planContent?.macro_targets ? (
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="rounded-lg bg-muted/30 p-2">
                          <div className="text-xs text-muted-foreground">Protein</div>
                          <div className="font-semibold">
                            {planContent.macro_targets.protein}g
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-2">
                          <div className="text-xs text-muted-foreground">Carbs</div>
                          <div className="font-semibold">
                            {planContent.macro_targets.carbs}g
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-2">
                          <div className="text-xs text-muted-foreground">Fat</div>
                          <div className="font-semibold">
                            {planContent.macro_targets.fat}g
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Macro targets not provided.
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="text-sm font-bold text-foreground mb-2">
                      Meals
                    </div>
                    {Array.isArray(planContent?.meals) && planContent.meals.length > 0 ? (
                      <div className="space-y-2">
                        {planContent.meals.slice(0, 10).map((meal) => (
                          <div
                            key={meal.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm"
                          >
                            <div className="font-semibold text-foreground">
                              {meal.name}{" "}
                              <span className="text-muted-foreground font-normal">
                                ({meal.type})
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              {meal.calories} kcal • P{meal.protein} C{meal.carbs} F{meal.fat}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Meals not provided in this plan.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRec?.category === "Workout" && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border p-4">
                    <div className="text-sm font-bold text-foreground mb-2">
                      Workout Plan
                    </div>
                    {planContent?.workout_plan ? (
                      <div className="space-y-2">
                        {parseWorkoutPlan(planContent.workout_plan).summary.slice(0, 12).map((line, idx) => (
                          <div key={idx} className="text-sm text-foreground">
                            {line}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Workout plan not provided.
                      </div>
                    )}
                  </div>

                  {Array.isArray(planContent?.training_days) && planContent.training_days.length > 0 && (
                    <div className="rounded-xl border border-border p-4">
                      <div className="text-sm font-bold text-foreground mb-3">
                        Training Days
                      </div>
                      <div className="space-y-3">
                        {planContent.training_days.slice(0, 7).map((day) => (
                          <div key={day.day} className="rounded-lg bg-muted/30 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-semibold text-foreground">
                                Day {day.day}: {day.focus}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {day.duration_minutes} min
                              </div>
                            </div>
                            {Array.isArray(day.exercises) && day.exercises.length > 0 && (
                              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                {day.exercises.slice(0, 8).map((ex, idx) => (
                                  <div key={idx}>
                                    {ex.name} • {ex.sets}x{ex.reps}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(selectedRec?.category === "Recovery" || selectedRec?.category === "Lifestyle") && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border p-4">
                    <div className="text-sm font-bold text-foreground mb-2">
                      Daily Routine Highlights
                    </div>
                    {planContent?.daily_routine ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {parseRoutine(planContent.daily_routine).slice(0, 10).map((item, idx) => (
                          <div key={idx} className="rounded-lg bg-muted/30 px-3 py-2">
                            <div className="text-xs font-semibold text-muted-foreground">
                              {item.label}
                            </div>
                            <div className="text-sm text-foreground">
                              {item.value || "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Daily routine not provided.
                      </div>
                    )}
                  </div>

                  {Array.isArray(planContent?.safety_notes) && planContent.safety_notes.length > 0 && (
                    <div className="rounded-xl border border-border p-4">
                      <div className="text-sm font-bold text-foreground mb-2">
                        Safety Notes
                      </div>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {planContent.safety_notes.slice(0, 10).map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(planContent?.insights) && planContent.insights.length > 0 && (
                    <div className="rounded-xl border border-border p-4">
                      <div className="text-sm font-bold text-foreground mb-2">
                        Insights
                      </div>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {planContent.insights.slice(0, 10).map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {planContent?.next_week_focus && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <div className="text-sm font-bold text-foreground mb-1">
                        Next Week Focus
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {planContent.next_week_focus}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!selectedRec?.category && (
                <div className="text-sm text-muted-foreground">
                  No category selected.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
