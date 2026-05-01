import { chatWithOllama, getOllamaUserMessage, type OllamaMessage } from "./ollama.service";
import type { UserAiContext } from "./user-context.service";

export type RecommendationCategory = "Nutrition" | "Workout" | "Recovery" | "Lifestyle";
export type RecommendationPriority = "High" | "Medium" | "Low";

export type MacroTargets = {
  protein: number;
  carbs: number;
  fat: number;
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
  daily_routine: string;
  calorie_target: number;
  macro_targets: MacroTargets;
  hydration_goal_liters: number;
  meals: NutritionMeal[];
  insights: string[];
  progress_summary: string;
  adjustment_summary: string;
  recommendation_cards: RecommendationCard[];
  safety_notes: string[];
};

export type AdjustmentDecision =
  | { action: "increase_intensity"; reason: string }
  | { action: "reduce_difficulty"; reason: string }
  | { action: "no_change"; reason: string };

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
const CARD_CATEGORIES = ["Nutrition", "Workout", "Recovery", "Lifestyle"] as const;
const CARD_PRIORITIES = ["High", "Medium", "Low"] as const;
const CARD_ICONS = new Set(["utensils", "dumbbell", "moon", "droplets", "trending-up", "heart", "activity"]);

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

  return {
    id: asString(card.id, `ai-card-${index + 1}`),
    category,
    priority: normalizeCardPriority(card.priority),
    title: asString(card.title, `${category} recommendation`),
    description: asString(card.description, "Follow the latest AI recommendation from your plan."),
    action: asString(card.action, "Review plan"),
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
): AiRecommendationContent {
  const root = asObject(value);
  const plan = asObject(root.recommendation ?? root.plan ?? root);

  const workoutPlan = asString(plan.workout_plan, "");
  const dailyRoutine = asString(plan.daily_routine, "");
  const weightKg = Number(profile.initial_weight_kg ?? 75);
  const fallbackCalories = Math.round(Math.min(3600, Math.max(1500, weightKg * 28)));
  const calorieTarget = asNumber(plan.calorie_target, fallbackCalories, { min: 1200, max: 5000 });

  if (!workoutPlan || !dailyRoutine) {
    throw new AiContentError("AI recommendation is missing workout_plan or daily_routine");
  }

  const macroTargetsInput = asObject(plan.macro_targets);
  const fallbackMacros = fallbackMacroTargets(calorieTarget, profile);
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
    workout_plan: workoutPlan,
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
    recommendation_cards: cardsInput.length > 0 ? cardsInput.map(normalizeCard) : fallbackCards,
    safety_notes: asStringArray(plan.safety_notes, ["Stop any exercise that causes sharp pain and consult a professional if needed."], 4),
  };
}

function compactContext(context: UserAiContext) {
  return {
    profile: context.profile,
    recent_measurements: context.measurements,
    recent_adherence_logs: context.adherenceLogs,
    active_plan: context.activeRecommendation
      ? {
          version: context.activeRecommendation.version,
          generated_by: context.activeRecommendation.generated_by,
          content: context.activeRecommendation.content,
        }
      : null,
  };
}

export function buildRecommendationMessages(context: UserAiContext): OllamaMessage[] {
  return [
    {
      role: "system",
      content:
        "You are LifeFit AI, a practical fitness and nutrition coach. Generate safe, specific, actionable plans from the user's data. Respect injuries and chronic flags. Do not invent missing measurements; say when data is limited. Return only valid JSON.",
    },
    {
      role: "user",
      content: [
        "Create a personalized recommendation plan for this user.",
        "Return a single JSON object with exactly these top-level keys:",
        "workout_plan, daily_routine, calorie_target, macro_targets, hydration_goal_liters, meals, insights, progress_summary, adjustment_summary, recommendation_cards, safety_notes.",
        "Formatting rules:",
        "- workout_plan must be a newline-separated string with summary lines 'Goal:', 'Experience:', 'Weekly frequency:', 'Session duration:', 'Focus:' followed by 'Day 1:', 'Day 2:' etc.",
        "- daily_routine must be a newline-separated string with 'Calories:', 'Protein:', 'Hydration:', 'Sleep:', 'Steps:', 'Recovery:'.",
        "- macro_targets must be grams per day: { protein, carbs, fat }.",
        "- meals must be 4 items with id, name, type, time, calories, protein, carbs, fat, tags. type must be Breakfast, Lunch, Dinner, or Snack.",
        "- recommendation_cards must use category Nutrition, Workout, Recovery, or Lifestyle and priority High, Medium, or Low.",
        "- Keep advice realistic for the user's gym days, session minutes, goal, level, injuries, measurements, and adherence.",
        `User context JSON: ${JSON.stringify(compactContext(context))}`,
      ].join("\n"),
    },
  ];
}

export async function generateRecommendationContent(context: UserAiContext) {
  const raw = await chatWithOllama(buildRecommendationMessages(context), {
    format: "json",
    temperature: 0.2,
    timeoutMs: 180_000,
  });
  return normalizeRecommendationContent(parseJsonObject(raw), context.profile ?? {});
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
