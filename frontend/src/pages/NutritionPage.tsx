import { useEffect, useMemo, useState } from "react";
import { Droplet, Plus, Minus, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SidebarLayout } from "@/components/SidebarLayout";
import { api, type NutritionToday } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

const colors = {
  Breakfast: "bg-orange-500",
  Lunch: "bg-blue-500",
  Dinner: "bg-purple-500",
  Snack: "bg-emerald-500",
};

export default function NutritionPage() {
  const [nutrition, setNutrition] = useState<NutritionToday | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [glasses, setGlasses] = useState(6);

  const maxGlasses = 8;
  const goalLiters = nutrition?.hydration.goal_liters ?? 2.5;
  const currentLiters = nutrition?.hydration.current_liters ?? 0;
  const glassVolume = goalLiters / maxGlasses;

  const loadNutrition = async (initialLoad = false) => {
    if (!initialLoad) {
      setIsRefreshing(true);
    }

    setError("");
    try {
      const response = await api.getNutritionToday();
      setNutrition(response);
      setGlasses(Math.max(0, Math.min(maxGlasses, Math.round(response.hydration.current_liters / (response.hydration.goal_liters / maxGlasses)))));
    } catch (err: any) {
      setError(err.message ?? "Unable to load nutrition plan");
    } finally {
      if (initialLoad) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadNutrition(true);
  }, []);

  const macroData = useMemo(() => {
    if (!nutrition) {
      return [];
    }

    return [
      { name: "Protein", value: nutrition.macros.protein, color: "#3B82F6" },
      { name: "Carbs", value: nutrition.macros.carbs, color: "#F97316" },
      { name: "Fat", value: nutrition.macros.fat, color: "#A855F7" },
    ];
  }, [nutrition]);

  const macroMax = useMemo(() => {
    if (!macroData.length) {
      return 1;
    }
    return Math.max(...macroData.map((item) => item.value), 1);
  }, [macroData]);

  const handleRegeneratePlan = async () => {
    setIsRefreshing(true);
    setError("");

    try {
      const recommendation = await api.generateRecommendationPlan();
      await loadNutrition();
      toast({
        title: `Nutrition refreshed (plan v${recommendation.version})`,
        description: "Macros and meals are updated from the local Ollama AI plan.",
      });
    } catch (err: any) {
      setError(err.message ?? "Unable to refresh nutrition plan");
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout className="p-4 sm:p-8">
        <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
          Loading nutrition plan...
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout className="p-4 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
            Meal Plan & Nutrition
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Local Ollama AI plan for{" "}
            {nutrition?.date
              ? new Date(nutrition.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })
              : "Today"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRegeneratePlan}
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-white border border-border hover:bg-muted text-foreground px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Regenerate Plan"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground mb-2">Planned Calories</p>
          <div className="flex items-end justify-between mb-2">
            <h3 className="text-2xl font-bold text-foreground">
              {nutrition?.consumed_calories ?? 0}{" "}
              <span className="text-sm font-medium text-muted-foreground">
                / {nutrition?.calorie_target ?? 0}
              </span>
            </h3>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(((nutrition?.consumed_calories ?? 0) / Math.max(1, nutrition?.calorie_target ?? 1)) * 100),
                )}%`,
              }}
            />
          </div>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground mb-2">Protein</p>
          <h3 className="text-2xl font-bold text-foreground">{nutrition?.macros.protein ?? 0}g</h3>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground mb-2">Carbs</p>
          <h3 className="text-2xl font-bold text-foreground">{nutrition?.macros.carbs ?? 0}g</h3>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground mb-2">Fat</p>
          <h3 className="text-2xl font-bold text-foreground">{nutrition?.macros.fat ?? 0}g</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-foreground mb-1">Water Intake</h3>
          <p className="text-sm text-muted-foreground mb-6">Stay hydrated for optimal recovery</p>

          <div className="flex-1 flex flex-col items-center justify-center">
            <h4 className="text-3xl font-extrabold text-blue-500 mb-1">
              {(glasses * glassVolume).toFixed(1)}L{" "}
              <span className="text-lg text-muted-foreground">/ {goalLiters.toFixed(1)}L</span>
            </h4>
            <p className="text-sm font-medium text-muted-foreground mb-6">
              {glasses}/{maxGlasses} glasses ({currentLiters.toFixed(1)}L planned baseline)
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-[200px]">
              {Array.from({ length: maxGlasses }).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-10 rounded-b-xl rounded-t-sm border-2 flex items-end justify-center overflow-hidden transition-all duration-300 ${
                    i < glasses ? "border-blue-400 bg-blue-50" : "border-border bg-muted"
                  }`}
                >
                  {i < glasses && <div className="w-full bg-blue-400 h-[70%] animate-in slide-in-from-bottom-full" />}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setGlasses(Math.max(0, glasses - 1))}
                className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGlasses(Math.min(maxGlasses, glasses + 1))}
                className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 w-full">
            <h3 className="text-lg font-bold text-foreground mb-6">Macronutrient Breakdown</h3>
            <div className="space-y-4">
              {macroData.map((macro) => (
                <div key={macro.name} className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
                  <span className="text-sm font-medium w-16">{macro.name}</span>
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((macro.value / macroMax) * 100)}%`,
                        backgroundColor: macro.color,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{macro.value}g</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[200px] w-[200px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-foreground mb-4">Today's Meals</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500 mb-8">
        {mealTypes.map((type) => (
          <div key={type} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${colors[type]}`} />
              <h4 className="font-bold text-foreground">{type}</h4>
            </div>

            <div className="p-4 flex-1 space-y-4">
              {nutrition?.meals
                .filter((meal) => meal.type === type)
                .map((meal) => (
                  <div
                    key={meal.id}
                    className="p-4 bg-background border border-border rounded-xl hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-foreground">{meal.name}</h5>
                      <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {meal.time}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground mb-3 flex items-center gap-3">
                      <span className="font-bold text-primary">{meal.calories} kcal</span>
                      <span>•</span>
                      <span>{meal.protein}g P</span>
                      <span>•</span>
                      <span>{meal.carbs}g C</span>
                      <span>•</span>
                      <span>{meal.fat}g F</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {meal.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold border border-border"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl border border-border p-6 shadow-sm">
        <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Droplet className="w-4 h-4" /> Nutrition Insights
        </h4>
        <div className="flex flex-wrap gap-3">
          {(nutrition?.insights ?? []).map((insight) => (
            <span
              key={insight}
              className="px-4 py-2 bg-white rounded-xl text-sm font-medium border border-border shadow-sm text-slate-700"
            >
              {insight}
            </span>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}
