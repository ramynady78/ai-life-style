import { chatWithOllama, getOllamaUserMessage, type OllamaMessage } from "./ollama.service";
import type { UserAiContext } from "./user-context.service";

export type RecommendationCategory = "Nutrition" | "Workout" | "Recovery" | "Lifestyle";
export type RecommendationPriority = "High" | "Medium" | "Low";
export type AdherenceLevel = "low" | "medium" | "high";
export type AdherenceLevelV6 = "low" | "moderate" | "high" | "insufficient_data";
export type StrengthTrend = "improving" | "plateau" | "declining" | "insufficient_data";

export type MacroTargets = {
  protein: number;
  carbs: number;
  fat: number;
};

export type TrainingDayExercise = {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string;
};

export type TrainingDay = {
  day: number;
  focus: string;
  duration_minutes: number;
  exercises: TrainingDayExercise[];
};

export type NutritionMeal = {
  id: string;
  name: string;
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
};

export type RecommendationCard = {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  action: string;
  icon: string;
};

export type AiRecommendationContent = {
  workout_plan: string;
  training_days?: TrainingDay[];
  daily_routine: string;
  calorie_target: number;
  macro_targets: MacroTargets;
  hydration_goal_liters: number;
  meals: NutritionMeal[];
  insights: string[];
  progress_summary: string;
  adjustment_summary: string;
  adherence_level?: AdherenceLevel;
  personalization_factors?: string[];
  next_week_focus?: string;
  recommendation_cards: RecommendationCard[];
  safety_notes: string[];
};

export type AiRecommendationV6Analysis = {
  adherence_level: AdherenceLevelV6;
  workout_completion_percentage: number | null;
  meal_adherence_percentage: number | null;
  problem_areas: string[];
  positive_signals: string[];
  decision: string;
  strategy: string;
};

export type AiRecommendationV6Adjustments = {
  calorie_adjustment: string;
  macro_adjustment: string;
  workout_adjustment: string;
  recovery_adjustment: string;
};

export type AiRecommendationV6Content = AiRecommendationContent & {
  analysis: AiRecommendationV6Analysis;
  adjustments: AiRecommendationV6Adjustments;
  hydration_goal_liters: number;
  progress_summary: string;
  adjustment_summary: string;
  safety_notes: string[];
};

export type AiRecommendationV6Envelope = {
  version: 6;
  status: "active";
  generated_by: "ai";
  content: AiRecommendationV6Content;
};

export type AdjustmentDecision =
  | { action: "increase_intensity"; reason: string }
  | { action: "reduce_difficulty"; reason: string }
  | { action: "no_change"; reason: string };

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
const CARD_CATEGORIES = ["Nutrition", "Workout", "Recovery", "Lifestyle"] as const;
const CARD_PRIORITIES = ["High", "Medium", "Low"] as const;
const CARD_ICONS = new Set(["utensils", "dumbbell", "moon", "droplets", "trending-up", "heart", "activity"]);
const ADHERENCE_LEVELS = ["low", "medium", "high"] as const;
const ADHERENCE_LEVELS_V6 = ["low", "moderate", "high", "insufficient_data"] as const;

export class AiContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiContentError";
  }
}

function asObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, any>) : {};
}

function asString(value: unknown, fallback: string) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback;
}

function asEnum<T extends readonly string[]>(value: unknown, options: T, fallback: T[number]): T[number] {
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    const match = options.find((option) => option.toLowerCase() === lowered);
    if (match) return match as T[number];
  }

  return fallback;
}

function asNumber(value: unknown, fallback: number, options: { min?: number; max?: number } = {}) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const min = options.min ?? Number.NEGATIVE_INFINITY;
  const max = options.max ?? Number.POSITIVE_INFINITY;
  return Math.round(Math.min(max, Math.max(min, parsed)));
}

function asStringArray(value: unknown, fallback: string[], maxItems = 8) {
  const rawItems = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const items = rawItems
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, maxItems);

  return items.length > 0 ? items : fallback;
}

function normalizeMealType(value: unknown, index: number): NutritionMeal["type"] {
  if (typeof value === "string") {
    const match = MEAL_TYPES.find((type) => type.toLowerCase() === value.toLowerCase());
    if (match) return match;
  }

  return MEAL_TYPES[Math.min(index, MEAL_TYPES.length - 1)];
}

function normalizeCardCategory(value: unknown): RecommendationCategory {
  if (typeof value === "string") {
    const match = CARD_CATEGORIES.find((category) => category.toLowerCase() === value.toLowerCase());
    if (match) return match;
  }

  return "Lifestyle";
}

function normalizeCardPriority(value: unknown): RecommendationPriority {
  if (typeof value === "string") {
    const match = CARD_PRIORITIES.find((priority) => priority.toLowerCase() === value.toLowerCase());
    if (match) return match;
  }

  return "Medium";
}

function fallbackMacroTargets(calorieTarget: number, profile: Record<string, any> = {}): MacroTargets {
  const weightKg = Number(profile.initial_weight_kg ?? 75);
  const protein = asNumber(weightKg * 1.8, 135, { min: 90, max: 260 });
  const fat = asNumber((calorieTarget * 0.25) / 9, 70, { min: 45, max: 130 });
  const carbs = asNumber((calorieTarget - protein * 4 - fat * 9) / 4, 220, { min: 90, max: 450 });

  return { protein, carbs, fat };
}

export function calculateAdherenceLevel(adherenceLogs: Record<string, any>[]): {
  level: AdherenceLevel;
  completionPctAvg: number;
  workoutsDoneRate: number;
  recentStreakDays: number;
} {
  const normalizedLogs = Array.isArray(adherenceLogs) ? adherenceLogs : [];
  if (normalizedLogs.length === 0) {
    return { level: "medium", completionPctAvg: 0, workoutsDoneRate: 0, recentStreakDays: 0 };
  }

  const completionValues = normalizedLogs
    .map((log) => Number(log?.completion_pct))
    .filter((value) => Number.isFinite(value));
  const completionPctAvg =
    completionValues.length > 0
      ? Math.round(completionValues.reduce((sum, value) => sum + value, 0) / completionValues.length)
      : 0;

  const doneValues = normalizedLogs.map((log) => Boolean(log?.workout_done));
  const workoutsDoneRate = doneValues.length > 0 ? doneValues.filter(Boolean).length / doneValues.length : 0;

  let recentStreakDays = 0;
  for (let i = normalizedLogs.length - 1; i >= 0; i -= 1) {
    if (!normalizedLogs[i]?.workout_done) break;
    recentStreakDays += 1;
  }

  const score = completionPctAvg * 0.7 + workoutsDoneRate * 100 * 0.3;
  const level: AdherenceLevel = score >= 80 ? "high" : score >= 55 ? "medium" : "low";

  return { level, completionPctAvg, workoutsDoneRate: Number(workoutsDoneRate.toFixed(2)), recentStreakDays };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 10) return null;
  return value.slice(0, 10);
}

function takeLast7Days<T extends Record<string, any>>(rows: T[], dateKey: string): T[] {
  const cutoff = daysAgoIso(7);
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const iso = toIsoDate(row?.[dateKey]);
    return iso != null && iso >= cutoff;
  });
}

function averageNumber(values: Array<number | null | undefined>): number | null {
  const usable = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (usable.length === 0) return null;
  return Number((usable.reduce((sum, value) => sum + value, 0) / usable.length).toFixed(1));
}

function percent(completed: number, total: number): number | null {
  if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) return null;
  return Math.round((completed / total) * 100);
}

export type AdaptiveMetrics = {
  workout_completion_percentage: number | null;
  meal_adherence_percentage: number | null;
  average_daily_calories: number | null;
  average_daily_protein: number | null;
  average_daily_steps: number | null;
  average_sleep_hours: number | null;
  missed_workouts_count: number | null;
  completed_workouts_count: number | null;
  weight_change: number | null;
  strength_trend: StrengthTrend;
};

export function classifyAdherenceLevel(score: number | null): AdherenceLevelV6 {
  if (score == null || !Number.isFinite(score)) return "insufficient_data";
  if (score >= 80) return "high";
  if (score >= 60) return "moderate";
  return "low";
}

export function calculateAdaptiveMetrics(context: UserAiContext): AdaptiveMetrics {
  const adherenceLast7 = takeLast7Days(context.adherenceLogs ?? [], "log_date");
  const measurementsLast7 = takeLast7Days(context.measurements ?? [], "measured_at");

  const workoutTotal = adherenceLast7.length;
  const workoutCompleted = adherenceLast7.filter((row) => Boolean(row?.workout_done)).length;
  const workout_completion_percentage = workoutTotal > 0 ? percent(workoutCompleted, workoutTotal) : null;
  const completed_workouts_count = workoutTotal > 0 ? workoutCompleted : null;
  const missed_workouts_count = workoutTotal > 0 ? workoutTotal - workoutCompleted : null;

  const meal_adherence_percentage =
    adherenceLast7.length > 0 ? averageNumber(adherenceLast7.map((row) => (row?.completion_pct == null ? null : Number(row.completion_pct)))) : null;

  const average_daily_steps = averageNumber(measurementsLast7.map((row) => (row?.steps_avg == null ? null : Number(row.steps_avg))));
  const average_sleep_hours = averageNumber(
    measurementsLast7.map((row) => (row?.sleep_hours_avg == null ? null : Number(row.sleep_hours_avg))),
  );

  const weightValues = measurementsLast7
    .map((row) => (row?.weight_kg == null ? null : Number(row.weight_kg)))
    .filter((value) => Number.isFinite(Number(value))) as number[];
  const weight_change = weightValues.length >= 2 ? Number((weightValues[weightValues.length - 1] - weightValues[0]).toFixed(1)) : null;

  return {
    workout_completion_percentage,
    meal_adherence_percentage: meal_adherence_percentage == null ? null : clamp(Math.round(meal_adherence_percentage), 0, 100),
    average_daily_calories: null,
    average_daily_protein: null,
    average_daily_steps,
    average_sleep_hours,
    missed_workouts_count,
    completed_workouts_count,
    weight_change,
    strength_trend: "insufficient_data",
  };
}

export function calculateGlobalAdherenceLevel(metrics: AdaptiveMetrics): AdherenceLevelV6 {
  const workout = metrics.workout_completion_percentage;
  const meal = metrics.meal_adherence_percentage;

  if (workout == null && meal == null) return "insufficient_data";
  if (workout == null) return classifyAdherenceLevel(meal);
  if (meal == null) return classifyAdherenceLevel(workout);

  return classifyAdherenceLevel(Math.round((workout + meal) / 2));
}

export function deriveStrategy(metrics: AdaptiveMetrics, goalType: string): string {
  const workoutLevel = classifyAdherenceLevel(metrics.workout_completion_percentage);
  const mealLevel = classifyAdherenceLevel(metrics.meal_adherence_percentage);
  const globalLevel = calculateGlobalAdherenceLevel(metrics);

  if (globalLevel === "low") return "simplify_plan_and_focus_on_consistency";
  if (mealLevel === "low" && (workoutLevel === "moderate" || workoutLevel === "high")) return "improve_nutrition_consistency";
  if (workoutLevel === "low" && (mealLevel === "moderate" || mealLevel === "high")) return "reduce_training_complexity";
  if (metrics.strength_trend === "plateau" && (globalLevel === "moderate" || globalLevel === "high")) return "progressive_overload_adjustment";
  if (goalType === "gain_muscle" && metrics.weight_change != null && metrics.weight_change <= 0 && (globalLevel === "moderate" || globalLevel === "high")) {
    return "increase_calories_slightly";
  }

  return "maintain_plan";
}

export function estimateCalorieTarget(profile: Record<string, any>, adherenceLevel: AdherenceLevel) {
  const weightKg = Number(profile.initial_weight_kg ?? 75);
  const goalType = typeof profile.goal_type === "string" ? profile.goal_type : "maintain";

  const baseline = clamp(Math.round(weightKg * 28), 1500, 3600);
  const goalMultiplier = goalType === "lose_weight" ? 0.85 : goalType === "gain_muscle" ? 1.1 : 1.0;
  const adherenceMultiplier = adherenceLevel === "low" ? 0.95 : adherenceLevel === "high" ? 1.02 : 1.0;

  return clamp(Math.round(baseline * goalMultiplier * adherenceMultiplier), 1200, 5000);
}

export function estimateMacroTargets(
  calorieTarget: number,
  profile: Record<string, any>,
  adherenceLevel: AdherenceLevel,
): MacroTargets {
  const weightKg = Number(profile.initial_weight_kg ?? 75);
  const goalType = typeof profile.goal_type === "string" ? profile.goal_type : "maintain";

  const proteinPerKg = goalType === "gain_muscle" ? 2.0 : 1.8;
  const protein =
    adherenceLevel === "low"
      ? clamp(Math.round(weightKg * (proteinPerKg - 0.2)), 80, 260)
      : clamp(Math.round(weightKg * proteinPerKg), 90, 280);

  const fatRatio = goalType === "lose_weight" ? 0.25 : 0.27;
  const fat = clamp(Math.round((calorieTarget * fatRatio) / 9), 45, 130);

  const carbs = clamp(Math.round((calorieTarget - protein * 4 - fat * 9) / 4), 90, 450);
  return { protein, carbs, fat };
}

function buildTrainingDaySkeleton(profile: Record<string, any>, adherenceLevel: AdherenceLevel): TrainingDay[] {
  const gymDays = clamp(Number(profile.gym_days_per_week ?? 3), 2, 6);
  const duration = clamp(Number(profile.session_minutes ?? (adherenceLevel === "low" ? 40 : 60)), 25, 90);
  const goalType = typeof profile.goal_type === "string" ? profile.goal_type : "maintain";

  const focusesByGoal: Record<string, string[]> = {
    lose_weight: ["Full body + cardio", "Lower body + core", "Upper body + conditioning", "Cardio + mobility"],
    gain_muscle: ["Upper body strength", "Lower body strength", "Upper hypertrophy", "Lower hypertrophy", "Arms + core"],
    maintain: ["Full body strength", "Cardio + core", "Full body balance", "Mobility + conditioning"],
  };
  const focuses = focusesByGoal[goalType] ?? focusesByGoal.maintain;

  const templates: TrainingDay[] = [];
  for (let index = 0; index < gymDays; index += 1) {
    templates.push({
      day: index + 1,
      focus: focuses[index % focuses.length],
      duration_minutes: duration,
      exercises: [],
    });
  }

  return templates;
}

function fallbackMeals(calorieTarget: number, macros: MacroTargets): NutritionMeal[] {
  const templates: Array<{ type: NutritionMeal["type"]; name: string; ratio: number; time: string; tags: string[] }> = [
    { type: "Breakfast", name: "High-protein breakfast bowl", ratio: 0.25, time: "07:30", tags: ["Protein", "Fiber"] },
    { type: "Lunch", name: "Lean protein lunch plate", ratio: 0.3, time: "12:30", tags: ["Balanced", "Meal prep"] },
    { type: "Snack", name: "Protein snack and fruit", ratio: 0.15, time: "16:00", tags: ["Convenient"] },
    { type: "Dinner", name: "Recovery dinner plate", ratio: 0.3, time: "19:00", tags: ["Recovery", "Balanced"] },
  ];

  return templates.map((item, index) => {
    const calories = Math.round(calorieTarget * item.ratio);
    const macroRatio = calories / Math.max(calorieTarget, 1);

    return {
      id: `m${index + 1}`,
      name: item.name,
      type: item.type,
      time: item.time,
      calories,
      protein: Math.round(macros.protein * macroRatio),
      carbs: Math.round(macros.carbs * macroRatio),
      fat: Math.round(macros.fat * macroRatio),
      tags: item.tags,
    };
  });
}

function normalizeMeal(value: unknown, index: number, calorieTarget: number, macros: MacroTargets): NutritionMeal {
  const fallback = fallbackMeals(calorieTarget, macros)[index] ?? fallbackMeals(calorieTarget, macros)[0];
  const meal = asObject(value);

  return {
    id: asString(meal.id, fallback.id),
    name: asString(meal.name, fallback.name),
    type: normalizeMealType(meal.type, index),
    time: asString(meal.time, fallback.time),
    calories: asNumber(meal.calories, fallback.calories, { min: 100, max: 1500 }),
    protein: asNumber(meal.protein, fallback.protein, { min: 0, max: 120 }),
    carbs: asNumber(meal.carbs, fallback.carbs, { min: 0, max: 200 }),
    fat: asNumber(meal.fat, fallback.fat, { min: 0, max: 100 }),
    tags: asStringArray(meal.tags, fallback.tags, 4),
  };
}

function normalizeCard(value: unknown, index: number): RecommendationCard {
  const card = asObject(value);
  const category = normalizeCardCategory(card.category);
  const fallbackIcon =
    category === "Nutrition"
      ? "utensils"
      : category === "Workout"
        ? "dumbbell"
        : category === "Recovery"
          ? "moon"
          : "trending-up";
  const icon = asString(card.icon, fallbackIcon).toLowerCase();
  const fallbackDescription =
    category === "Nutrition"
      ? "Make nutrition easier: hit protein first, then align calories with your target."
      : category === "Workout"
        ? "Keep training consistent: complete the planned sessions and track each workout."
        : category === "Recovery"
          ? "Support recovery: prioritize sleep, mobility, and easier sessions when needed."
          : "Improve one habit this week and keep it repeatable.";

  return {
    id: asString(card.id, `ai-card-${index + 1}`),
    category,
    priority: normalizeCardPriority(card.priority),
    title: asString(card.title, `${category} recommendation`),
    description: asString(card.description, fallbackDescription),
    action: asString(card.action, category === "Workout" ? "Open workout plan" : category === "Nutrition" ? "Open nutrition" : "View details"),
    icon: CARD_ICONS.has(icon) ? icon : fallbackIcon,
  };
}

export function parseJsonObject(raw: string): Record<string, any> {
  try {
    return asObject(JSON.parse(raw));
  } catch {
    const withoutFence = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new AiContentError("AI response was not valid JSON");
    }

    try {
      return asObject(JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1)));
    } catch {
      throw new AiContentError("AI response was not valid JSON");
    }
  }
}

export function normalizeRecommendationContent(
  value: unknown,
  profile: Record<string, any> = {},
): AiRecommendationV6Content {
  const root = asObject(value);
  const plan = asObject(root.content ?? root.recommendation ?? root.plan ?? root);

  const adherenceLevel = asEnum(plan.adherence_level, ADHERENCE_LEVELS, "medium");

  const trainingDaysInput = Array.isArray(plan.training_days) ? plan.training_days.slice(0, 7) : [];
  const trainingDays: TrainingDay[] | undefined =
    trainingDaysInput.length > 0
      ? trainingDaysInput
          .map((item) => asObject(item))
          .map((day, index) => {
            const exercisesInput = Array.isArray(day.exercises) ? day.exercises.slice(0, 16) : [];
            const exercises: TrainingDayExercise[] = exercisesInput.map((exercise) => {
              const normalized = asObject(exercise);
              return {
                name: asString(normalized.name, "Exercise"),
                sets: asNumber(normalized.sets, 3, { min: 1, max: 8 }),
                reps: asString(normalized.reps, "8-12"),
                rest_seconds: asNumber(normalized.rest_seconds, 90, { min: 15, max: 300 }),
                notes: asString(normalized.notes, ""),
              };
            });

            return {
              day: asNumber(day.day, index + 1, { min: 1, max: 7 }),
              focus: asString(day.focus, `Day ${index + 1}`),
              duration_minutes: asNumber(day.duration_minutes, Number(profile.session_minutes ?? 60), {
                min: 20,
                max: 120,
              }),
              exercises,
            };
          })
      : undefined;

  const workoutPlan = asString(plan.workout_plan, "");
  const dailyRoutine = asString(plan.daily_routine, "");
  const weightKg = Number(profile.initial_weight_kg ?? 75);
  const fallbackCalories = estimateCalorieTarget(profile, adherenceLevel);
  const calorieTarget = asNumber(plan.calorie_target, fallbackCalories, { min: 1200, max: 5000 });

  const hydratedWorkoutPlan =
    workoutPlan ||
    (trainingDays && trainingDays.length
      ? [
          `Goal: ${asString(profile.goal_type, "maintain")}`,
          `Experience: ${asString(profile.experience_level, "beginner")}`,
          `Weekly frequency: ${trainingDays.length} days`,
          `Session duration: ${asString(profile.session_minutes, "60")} minutes`,
          `Focus: ${trainingDays.map((day) => day.focus).join(" / ")}`,
          ...trainingDays.map(
            (day) =>
              `Day ${day.day}: ${day.focus}${day.exercises.length ? `, ${day.exercises.map((ex) => ex.name).join(", ")}` : ""}`,
          ),
        ].join("\n")
      : "");

  if (!hydratedWorkoutPlan || !dailyRoutine) {
    throw new AiContentError("AI recommendation is missing workout_plan (or training_days) or daily_routine");
  }

  const macroTargetsInput = asObject(plan.macro_targets);
  const fallbackMacros = estimateMacroTargets(calorieTarget, profile, adherenceLevel);
  const macroTargets: MacroTargets = {
    protein: asNumber(macroTargetsInput.protein, fallbackMacros.protein, { min: 60, max: 300 }),
    carbs: asNumber(macroTargetsInput.carbs, fallbackMacros.carbs, { min: 50, max: 600 }),
    fat: asNumber(macroTargetsInput.fat, fallbackMacros.fat, { min: 30, max: 180 }),
  };

  const mealsInput = Array.isArray(plan.meals) ? plan.meals.slice(0, 6) : [];
  const meals =
    mealsInput.length > 0
      ? mealsInput.map((meal, index) => normalizeMeal(meal, index, calorieTarget, macroTargets))
      : fallbackMeals(calorieTarget, macroTargets);

  const cardsInput = Array.isArray(plan.recommendation_cards) ? plan.recommendation_cards.slice(0, 8) : [];
  const fallbackCards: RecommendationCard[] = [
    {
      id: "ai-workout",
      category: "Workout",
      priority: "High",
      title: "Follow the generated training split",
      description: "Use the workout plan as the weekly structure and adjust load gradually.",
      action: "Review workout plan",
      icon: "dumbbell",
    },
    {
      id: "ai-nutrition",
      category: "Nutrition",
      priority: "High",
      title: "Hit the daily nutrition target",
      description: `Aim for about ${calorieTarget} kcal with consistent protein across meals.`,
      action: "Review meal plan",
      icon: "utensils",
    },
  ];

  return {
    workout_plan: hydratedWorkoutPlan,
    training_days: trainingDays,
    daily_routine: dailyRoutine,
    calorie_target: calorieTarget,
    macro_targets: macroTargets,
    hydration_goal_liters: Number(
      Math.min(5, Math.max(1.5, Number(plan.hydration_goal_liters ?? weightKg * 0.035))).toFixed(1),
    ),
    meals,
    insights: asStringArray(plan.insights, ["Use your tracking logs to adjust training and nutrition weekly."], 6),
    progress_summary: asString(plan.progress_summary, "Progress data is limited. Keep logging measurements and adherence."),
    adjustment_summary: asString(plan.adjustment_summary, "No major adjustment is required until more check-ins are logged."),
    adherence_level: adherenceLevel,
    personalization_factors: asStringArray(
      plan.personalization_factors,
      [
        profile.goal_type ? `Goal: ${profile.goal_type}` : "Goal was not set",
        profile.experience_level ? `Experience: ${profile.experience_level}` : "Experience level was not set",
        profile.gym_days_per_week != null ? `Preferred days: ${profile.gym_days_per_week}/week` : "Preferred workout days were not set",
      ],
      10,
    ),
    next_week_focus: asString(
      plan.next_week_focus,
      adherenceLevel === "low"
        ? "Focus on consistency: complete all planned sessions and hit protein daily."
        : "Focus on progressive overload: add a small load or rep to key lifts and maintain recovery.",
    ),
    recommendation_cards: cardsInput.length > 0 ? cardsInput.map(normalizeCard) : fallbackCards,
    safety_notes: asStringArray(plan.safety_notes, ["Stop any exercise that causes sharp pain and consult a professional if needed."], 4),
    analysis: {
      adherence_level: asEnum(plan.analysis?.adherence_level, ADHERENCE_LEVELS_V6, "insufficient_data"),
      workout_completion_percentage: typeof plan.analysis?.workout_completion_percentage === "number" ? plan.analysis.workout_completion_percentage : null,
      meal_adherence_percentage: typeof plan.analysis?.meal_adherence_percentage === "number" ? plan.analysis.meal_adherence_percentage : null,
      problem_areas: asStringArray(plan.analysis?.problem_areas, [], 8),
      positive_signals: asStringArray(plan.analysis?.positive_signals, [], 8),
      decision: asString(plan.analysis?.decision, ""),
      strategy: asString(plan.analysis?.strategy, ""),
    },
    adjustments: {
      calorie_adjustment: asString(plan.adjustments?.calorie_adjustment, ""),
      macro_adjustment: asString(plan.adjustments?.macro_adjustment, ""),
      workout_adjustment: asString(plan.adjustments?.workout_adjustment, ""),
      recovery_adjustment: asString(plan.adjustments?.recovery_adjustment, ""),
    },
  };
}

function compactContext(context: UserAiContext) {
  const metrics = calculateAdaptiveMetrics(context);
  const adherenceLevelV6 = calculateGlobalAdherenceLevel(metrics);
  const goalType = typeof context.profile?.goal_type === "string" ? context.profile.goal_type : "maintain";
  const strategy = deriveStrategy(metrics, goalType);

  return {
    profile: context.profile,
    user_goal: goalType,
    current_plan: context.activeRecommendation ? context.activeRecommendation.content : null,
    logs_last_7_days: takeLast7Days(context.adherenceLogs ?? [], "log_date"),
    workout_logs_last_7_days: takeLast7Days(context.adherenceLogs ?? [], "log_date").map((row) => ({
      log_date: row.log_date,
      workout_done: row.workout_done ?? false,
    })),
    meal_logs_last_7_days: takeLast7Days(context.adherenceLogs ?? [], "log_date").map((row) => ({
      log_date: row.log_date,
      completion_pct: row.completion_pct ?? null,
    })),
    sleep_logs_last_7_days: takeLast7Days(context.measurements ?? [], "measured_at")
      .filter((row) => row.sleep_hours_avg != null)
      .map((row) => ({ measured_at: row.measured_at, sleep_hours_avg: row.sleep_hours_avg })),
    steps_logs_last_7_days: takeLast7Days(context.measurements ?? [], "measured_at")
      .filter((row) => row.steps_avg != null)
      .map((row) => ({ measured_at: row.measured_at, steps_avg: row.steps_avg })),
    adherence_metrics: {
      workout_completion_percentage: metrics.workout_completion_percentage,
      meal_adherence_percentage: metrics.meal_adherence_percentage,
      missed_workouts_count: metrics.missed_workouts_count,
      completed_workouts_count: metrics.completed_workouts_count,
    },
    progress_metrics: {
      average_daily_steps: metrics.average_daily_steps,
      average_sleep_hours: metrics.average_sleep_hours,
      weight_change: metrics.weight_change,
      strength_trend: metrics.strength_trend,
      average_daily_calories: metrics.average_daily_calories,
      average_daily_protein: metrics.average_daily_protein,
    },
    adherence_level: adherenceLevelV6,
    strategy,
    active_plan: context.activeRecommendation
      ? {
          version: context.activeRecommendation.version,
          generated_by: context.activeRecommendation.generated_by,
          content: context.activeRecommendation.content,
        }
      : null,
  };
}

export function buildRecommendationMessages(context: UserAiContext, options: { strictJson?: boolean } = {}): OllamaMessage[] {
  const adherence = calculateAdherenceLevel(context.adherenceLogs ?? []);
  const profile = context.profile ?? {};
  const metrics = calculateAdaptiveMetrics(context);
  const goalType = typeof profile.goal_type === "string" ? profile.goal_type : "maintain";
  const globalAdherence = calculateGlobalAdherenceLevel(metrics);
  const strategy = deriveStrategy(metrics, goalType);
  const latestMeasurement =
    Array.isArray(context.measurements) && context.measurements.length ? context.measurements[context.measurements.length - 1] : null;
  const suggestedCalories = estimateCalorieTarget(profile, adherence.level);

  const problemAreas: string[] = [];
  const positiveSignals: string[] = [];

  if (metrics.workout_completion_percentage != null && metrics.workout_completion_percentage < 60) {
    problemAreas.push("Workout consistency");
  } else if (metrics.workout_completion_percentage != null && metrics.workout_completion_percentage >= 80) {
    positiveSignals.push("Workout consistency");
  }

  if (metrics.meal_adherence_percentage != null && metrics.meal_adherence_percentage < 60) {
    problemAreas.push("Nutrition consistency");
  } else if (metrics.meal_adherence_percentage != null && metrics.meal_adherence_percentage >= 80) {
    positiveSignals.push("Nutrition consistency");
  }

  if (metrics.average_sleep_hours != null && metrics.average_sleep_hours < 6) {
    problemAreas.push("Sleep and recovery");
  } else if (metrics.average_sleep_hours != null && metrics.average_sleep_hours >= 7) {
    positiveSignals.push("Sleep and recovery");
  }

  const derivedTargets = {
    adherence_level: globalAdherence,
    strategy,
    adherence_metrics: metrics,
    adherence_completion_pct_avg: adherence.completionPctAvg,
    adherence_workouts_done_rate: adherence.workoutsDoneRate,
    adherence_recent_streak_days: adherence.recentStreakDays,
    suggested_calorie_target: suggestedCalories,
    suggested_macro_targets: estimateMacroTargets(suggestedCalories, profile, adherence.level),
    suggested_training_days: buildTrainingDaySkeleton(profile, adherence.level),
    latest_sleep_hours_avg: latestMeasurement?.sleep_hours_avg ?? null,
    latest_steps_avg: latestMeasurement?.steps_avg ?? null,
  };

  const strictReminder = options.strictJson
    ? "You must output strictly valid JSON. Do not include markdown, code fences, trailing commas, or extra keys."
    : "Return JSON only, no markdown fences and no extra text.";

  return [
    {
      role: "system",
      content:
        [
          "You are LifeFit AI, a practical fitness and nutrition coach inside a healthy lifestyle app.",
          "Analyze recent behavior and adapt the user's plan when justified by data.",
          "Avoid medical claims. Keep guidance beginner-safe and practical.",
          strictReminder,
        ].join(" "),
    },
    {
      role: "user",
      content: [
        "Create or update the user's recommendation plan using the provided context.",
        "Return a single JSON object in this exact envelope shape:",
        "version, status, generated_by, content.",
        "version must be 6. status must be 'active'. generated_by must be 'ai'.",
        "content must contain these keys:",
        "analysis, adjustments, meals, workout_plan, daily_routine, macro_targets, calorie_target, progress_summary, adjustment_summary, insights, safety_notes, recommendation_cards, hydration_goal_liters.",
        "analysis keys: adherence_level, workout_completion_percentage, meal_adherence_percentage, problem_areas, positive_signals, decision, strategy.",
        "adjustments keys: calorie_adjustment, macro_adjustment, workout_adjustment, recovery_adjustment.",
        "Rules:",
        "- workout_plan must be a newline-separated string with summary lines 'Goal:', 'Experience:', 'Weekly frequency:', 'Session duration:', 'Focus:' followed by 'Day 1:', 'Day 2:' etc.",
        "- daily_routine must be a newline-separated string with 'Calories:', 'Protein:', 'Hydration:', 'Sleep:', 'Steps:', 'Recovery:'.",
        "- macro_targets must be grams per day: { protein, carbs, fat }.",
        "- meals must be 4 items with id, name, type, time, calories, protein, carbs, fat, tags. type must be Breakfast, Lunch, Dinner, or Snack.",
        "- recommendation_cards must use category Nutrition, Workout, Recovery, or Lifestyle and priority High, Medium, or Low.",
        "- analysis.adherence_level must be one of: high, moderate, low, insufficient_data.",
        "- Make recommendation_cards specific to this user's problem areas and progress (no generic filler).",
        "- Keep advice realistic for the user's gym days, session minutes, goal, level, injuries, measurements, and adherence.",
        "- If sleep is below 6 hours on average, reduce intensity and add recovery advice.",
        "- If workouts are missed often, simplify the plan and prioritize consistency.",
        `Problem areas hint (use if consistent with data): ${JSON.stringify(problemAreas)}`,
        `Positive signals hint (use if consistent with data): ${JSON.stringify(positiveSignals)}`,
        `Derived targets JSON (use these as guidance): ${JSON.stringify(derivedTargets)}`,
        `User context JSON: ${JSON.stringify(compactContext(context))}`,
      ].join("\n"),
    },
  ];
}

function buildFallbackV6(context: UserAiContext, reason: string): AiRecommendationV6Envelope {
  const profile = context.profile ?? {};
  const metrics = calculateAdaptiveMetrics(context);
  const goalType = typeof profile.goal_type === "string" ? profile.goal_type : "maintain";
  const adherenceLevelV6 = calculateGlobalAdherenceLevel(metrics);
  const strategy = deriveStrategy(metrics, goalType);
  const adherenceLegacy: AdherenceLevel = adherenceLevelV6 === "high" ? "high" : adherenceLevelV6 === "low" ? "low" : "medium";

  const calorieTarget = estimateCalorieTarget(profile, adherenceLegacy);
  const macros = estimateMacroTargets(calorieTarget, profile, adherenceLegacy);

  const workoutPlan = [
    `Goal: ${goalType}`,
    `Experience: ${asString(profile.experience_level, "beginner")}`,
    `Weekly frequency: ${asNumber(profile.gym_days_per_week, 3, { min: 2, max: 6 })} days`,
    `Session duration: ${asNumber(profile.session_minutes, adherenceLegacy === "low" ? 40 : 60, { min: 25, max: 90 })} minutes`,
    `Focus: ${goalType === "gain_muscle" ? "progressive overload" : goalType === "lose_weight" ? "strength + conditioning" : "strength + habits"}`,
    "",
    "Day 1: Full body strength + short cardio",
    "Day 2: Upper body + core",
    "Day 3: Lower body + mobility",
  ].join("\n");

  const dailyRoutine = [
    `Calories: ${calorieTarget} kcal/day`,
    `Protein: ${macros.protein}g`,
    `Hydration: ${Number((Number(profile.initial_weight_kg ?? 75) * 0.035).toFixed(1))}L`,
    `Sleep: ${metrics.average_sleep_hours != null ? `${metrics.average_sleep_hours}-8 hours` : "7-8 hours"}`,
    `Steps: ${metrics.average_daily_steps != null ? `${Math.round(metrics.average_daily_steps)}+` : "8000+"}`,
    "Recovery: 5-10 min mobility after training",
  ].join("\n");

  const cards: RecommendationCard[] = [
    {
      id: "ai-card-1",
      icon: "dumbbell",
      title: adherenceLevelV6 === "low" ? "Make workouts easier to complete" : "Keep your training momentum",
      action: "Open workout plan",
      category: "Workout",
      priority: "High",
      description:
        metrics.workout_completion_percentage == null
          ? "Log workouts this week so the plan can adapt."
          : metrics.workout_completion_percentage < 60
            ? "Your workouts were missed often this week. Use shorter sessions and aim for 2-3 consistent days before adding more."
            : "You completed most workouts this week. Keep the same split and add reps/weight only when form is stable.",
    },
    {
      id: "ai-card-2",
      icon: "utensils",
      title: metrics.meal_adherence_percentage != null && metrics.meal_adherence_percentage < 60 ? "Simplify your nutrition target" : "Hit protein daily",
      action: "Open nutrition",
      category: "Nutrition",
      priority: "High",
      description:
        metrics.meal_adherence_percentage == null
          ? "Track 3-4 days of meals to unlock more accurate adjustments."
          : metrics.meal_adherence_percentage < 60
            ? "Your meal adherence was below target this week. Add one simple high-protein snack after training and keep meals repeatable."
            : `Keep protein consistent across meals (target ~${macros.protein}g/day) and keep calories near ${calorieTarget} kcal.`,
    },
  ];

  if (metrics.average_sleep_hours != null && metrics.average_sleep_hours < 6) {
    cards.push({
      id: "ai-card-3",
      icon: "moon",
      title: "Prioritize sleep before progressing",
      action: "Open recovery tips",
      category: "Recovery",
      priority: "Medium",
      description: `Your sleep average is low (~${metrics.average_sleep_hours}h). Aim for 7-8 hours before increasing training intensity.`,
    });
  }

  return {
    version: 6,
    status: "active",
    generated_by: "ai",
    content: {
      analysis: {
        adherence_level: adherenceLevelV6,
        workout_completion_percentage: metrics.workout_completion_percentage,
        meal_adherence_percentage: metrics.meal_adherence_percentage,
        problem_areas: [],
        positive_signals: [],
        decision: reason,
        strategy,
      },
      adjustments: {
        calorie_adjustment: "no_change",
        macro_adjustment: "no_change",
        workout_adjustment: adherenceLevelV6 === "low" ? "simplify" : "maintain",
        recovery_adjustment: metrics.average_sleep_hours != null && metrics.average_sleep_hours < 6 ? "increase_sleep_focus" : "maintain",
      },
      workout_plan: workoutPlan,
      daily_routine: dailyRoutine,
      calorie_target: calorieTarget,
      macro_targets: macros,
      hydration_goal_liters: Number(Math.min(5, Math.max(1.5, Number(profile.initial_weight_kg ?? 75) * 0.035)).toFixed(1)),
      meals: fallbackMeals(calorieTarget, macros).slice(0, 4),
      insights: ["Keep tracking logs so next week's adjustments are based on your real consistency."],
      progress_summary: "Not enough AI-validated data to personalize further yet. Keep logging workouts and adherence for 7 days.",
      adjustment_summary: "Fallback plan used due to invalid AI JSON. Targets are based on your profile and recent adherence metrics.",
      recommendation_cards: cards,
      safety_notes: ["Stop any exercise that causes sharp pain and consult a professional if needed."],
    },
  };
}

export async function generateRecommendationContent(context: UserAiContext): Promise<AiRecommendationV6Envelope> {
  return generateRecommendationContentWithChat(context, chatWithOllama);
}

export async function generateRecommendationContentWithChat(
  context: UserAiContext,
  chatFn: typeof chatWithOllama,
): Promise<AiRecommendationV6Envelope> {
  const profile = context.profile ?? {};

  const attempt = async (strictJson: boolean) => {
    const raw = await chatFn(buildRecommendationMessages(context, { strictJson }), {
      format: "json",
      temperature: strictJson ? 0 : 0.2,
      timeoutMs: 180_000,
    });

    const parsed = parseJsonObject(raw);
    const envelope = asObject(parsed);
    const content = normalizeRecommendationContent(envelope, profile);

    const strategyFallback = deriveStrategy(calculateAdaptiveMetrics(context), typeof profile.goal_type === "string" ? profile.goal_type : "maintain");
    const analysis = content.analysis?.strategy ? content.analysis : { ...content.analysis, strategy: strategyFallback };

    return {
      version: 6 as const,
      status: "active" as const,
      generated_by: "ai" as const,
      content: {
        ...content,
        analysis,
      },
    };
  };

  try {
    return await attempt(false);
  } catch (error) {
    console.error("AI plan parse failed, retrying with strict JSON prompt:", error);
    try {
      return await attempt(true);
    } catch (retryError) {
      console.error("AI plan parse failed after retry, using fallback:", retryError);
      return buildFallbackV6(context, "AI output was invalid JSON; returning a safe fallback recommendation.");
    }
  }
}

export async function generateProgressAdjustment(context: UserAiContext): Promise<AdjustmentDecision> {
  const raw = await chatWithOllama(
    [
      {
        role: "system",
        content:
          "You are LifeFit AI. Review the user's latest measurement and adherence data against their active plan. Return only valid JSON.",
      },
      {
        role: "user",
        content: [
          "Return JSON with keys action and reason.",
          "action must be one of: increase_intensity, reduce_difficulty, no_change.",
          "reason must be one practical sentence for the user.",
          `User context JSON: ${JSON.stringify(compactContext(context))}`,
        ].join("\n"),
      },
    ],
    { format: "json", temperature: 0.2, timeoutMs: 90_000 },
  );

  const parsed = parseJsonObject(raw);
  const action = ["increase_intensity", "reduce_difficulty", "no_change"].includes(parsed.action)
    ? parsed.action
    : "no_change";
  const reason = asString(parsed.reason, "Current data does not require a plan adjustment yet.");

  return { action, reason } as AdjustmentDecision;
}

export function createAiUnavailableAdjustment(error: unknown): AdjustmentDecision {
  return {
    action: "no_change",
    reason: `${getOllamaUserMessage(error)} Your progress was saved, but AI adjustment is unavailable right now.`,
  };
}

export async function generateChatReply(
  context: UserAiContext,
  history: Array<{ role: "user" | "assistant"; content: string }>,
) {
  const contextMessage = [
    "User data available to you:",
    JSON.stringify(compactContext(context)),
    "Answer as a concise personal fitness coach. Use the user's language when possible. Respect injuries and avoid medical diagnosis.",
  ].join("\n");

  const messages: OllamaMessage[] = [
    {
      role: "system",
      content:
        "You are LifeFit AI Coach inside a healthy lifestyle app. Give practical, actionable coaching based on the provided user profile, plan, measurements, and adherence logs. If data is missing, ask for the exact missing input.",
    },
    { role: "user", content: contextMessage },
    ...history.slice(-10).map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  return chatWithOllama(messages, { temperature: 0.45, timeoutMs: 120_000 });
}
