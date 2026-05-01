const assert = require("node:assert/strict");
const test = require("node:test");

const {
  AiContentError,
  calculateAdaptiveMetrics,
  calculateGlobalAdherenceLevel,
  classifyAdherenceLevel,
  deriveStrategy,
  generateRecommendationContentWithChat,
  createAiUnavailableAdjustment,
  normalizeRecommendationContent,
  parseJsonObject,
} = require("../dist/server/services/ai.service");
const {
  OllamaServiceError,
  getOllamaErrorStatus,
  getOllamaUserMessage,
  normalizeOllamaBaseUrl,
} = require("../dist/server/services/ollama.service");

test("normalizes Ollama base URLs", () => {
  assert.equal(normalizeOllamaBaseUrl("http://127.0.0.1:11434"), "http://127.0.0.1:11434/api");
  assert.equal(normalizeOllamaBaseUrl("http://127.0.0.1:11434/api/"), "http://127.0.0.1:11434/api");
});

test("parses JSON objects from raw or fenced model output", () => {
  assert.deepEqual(parseJsonObject('{"ok":true}'), { ok: true });
  assert.deepEqual(parseJsonObject('```json\n{"ok":true}\n```'), { ok: true });
});

test("invalid recommendation JSON fails clearly", () => {
  assert.throws(() => parseJsonObject("not json"), AiContentError);
});

test("normalizes rich recommendation content", () => {
  const content = normalizeRecommendationContent(
    {
      workout_plan:
        "Goal: lose weight\nExperience: beginner\nWeekly frequency: 3 days\nSession duration: 60 minutes\nFocus: strength and cardio\nDay 1: Squat, push-up, walk",
      training_days: [
        {
          day: 1,
          focus: "Full body",
          duration_minutes: 60,
          exercises: [{ name: "Squat", sets: 3, reps: "8-10", rest_seconds: 90, notes: "" }],
        },
      ],
      daily_routine:
        "Calories: 2100 kcal/day\nProtein: 140g\nHydration: 2.7L\nSleep: 7-8 hours\nSteps: 8000\nRecovery: stretch",
      calorie_target: 2100,
      macro_targets: { protein: 140, carbs: 220, fat: 70 },
      hydration_goal_liters: 2.7,
      meals: [
        {
          id: "b1",
          name: "Oats and eggs",
          type: "Breakfast",
          time: "08:00",
          calories: 500,
          protein: 35,
          carbs: 55,
          fat: 15,
          tags: ["Protein"],
        },
      ],
      insights: ["Keep protein consistent."],
      progress_summary: "Progress is limited.",
      adjustment_summary: "Start with baseline plan.",
      recommendation_cards: [
        {
          id: "workout",
          category: "Workout",
          priority: "High",
          title: "Train three times",
          description: "Use full-body sessions.",
          action: "Open plan",
          icon: "dumbbell",
        },
      ],
      safety_notes: ["Avoid sharp pain."],
      adherence_level: "high",
      personalization_factors: ["Goal: lose_weight"],
      next_week_focus: "Stay consistent.",
    },
    { initial_weight_kg: 75 },
  );

  assert.equal(content.generated_by, undefined);
  assert.equal(content.calorie_target, 2100);
  assert.equal(content.macro_targets.protein, 140);
  assert.equal(content.meals[0].type, "Breakfast");
  assert.equal(content.recommendation_cards[0].category, "Workout");
  assert.equal(content.adherence_level, "high");
  assert.equal(content.training_days[0].day, 1);
});

test("computes adaptive metrics and adherence levels", () => {
  const context = {
    profile: { goal_type: "maintain", initial_weight_kg: 80 },
    measurements: [
      { measured_at: new Date().toISOString().slice(0, 10), weight_kg: 80, sleep_hours_avg: 7, steps_avg: 9000 },
    ],
    adherenceLogs: Array.from({ length: 7 }).map((_, index) => ({
      log_date: new Date(Date.now() - (6 - index) * 86400000).toISOString().slice(0, 10),
      workout_done: true,
      completion_pct: 90,
    })),
    activeRecommendation: null,
  };

  const metrics = calculateAdaptiveMetrics(context);
  assert.equal(metrics.workout_completion_percentage, 100);
  assert.equal(metrics.meal_adherence_percentage, 90);

  const global = calculateGlobalAdherenceLevel(metrics);
  assert.equal(global, "high");
  assert.equal(classifyAdherenceLevel(79), "moderate");
  assert.equal(classifyAdherenceLevel(null), "insufficient_data");
});

test("derives strategy based on adherence and goal", () => {
  const low = {
    workout_completion_percentage: 40,
    meal_adherence_percentage: 40,
    average_daily_calories: null,
    average_daily_protein: null,
    average_daily_steps: null,
    average_sleep_hours: null,
    missed_workouts_count: 4,
    completed_workouts_count: 3,
    weight_change: null,
    strength_trend: "insufficient_data",
  };
  assert.equal(deriveStrategy(low, "maintain"), "simplify_plan_and_focus_on_consistency");

  const nutritionLow = { ...low, workout_completion_percentage: 90, meal_adherence_percentage: 40 };
  assert.equal(deriveStrategy(nutritionLow, "maintain"), "improve_nutrition_consistency");

  const trainingLow = { ...low, workout_completion_percentage: 40, meal_adherence_percentage: 90 };
  assert.equal(deriveStrategy(trainingLow, "maintain"), "reduce_training_complexity");

  const gainMuscleNoWeight = { ...low, workout_completion_percentage: 85, meal_adherence_percentage: 85, weight_change: 0 };
  assert.equal(deriveStrategy(gainMuscleNoWeight, "gain_muscle"), "increase_calories_slightly");
});

test("fallback returns safe v6 envelope when model JSON is invalid", async () => {
  const context = {
    profile: { goal_type: "lose_weight", initial_weight_kg: 75, gym_days_per_week: 3, session_minutes: 60, experience_level: "beginner" },
    measurements: [],
    adherenceLogs: [
      { log_date: new Date().toISOString().slice(0, 10), workout_done: false, completion_pct: 40 },
    ],
    activeRecommendation: null,
  };

  let calls = 0;
  const chatFn = async () => {
    calls += 1;
    return "not json at all";
  };

  const originalError = console.error;
  console.error = () => {};

  const envelope = await generateRecommendationContentWithChat(context, chatFn);

  console.error = originalError;
  assert.equal(calls, 2);
  assert.equal(envelope.version, 6);
  assert.equal(envelope.status, "active");
  assert.equal(envelope.generated_by, "ai");
  assert.equal(typeof envelope.content.workout_plan, "string");
  assert.equal(typeof envelope.content.daily_routine, "string");
  assert.equal(envelope.content.analysis.adherence_level, "low");
});

test("maps Ollama errors to friendly status and fallback adjustment", () => {
  const missingModel = new OllamaServiceError("OLLAMA_MODEL_NOT_FOUND", "missing");
  const unavailable = new OllamaServiceError("OLLAMA_UNAVAILABLE", "down");
  const badResponse = new OllamaServiceError("OLLAMA_BAD_RESPONSE", "bad");

  assert.equal(getOllamaErrorStatus(missingModel), 503);
  assert.equal(getOllamaErrorStatus(unavailable), 503);
  assert.equal(getOllamaErrorStatus(badResponse), 502);
  assert.match(getOllamaUserMessage(missingModel), /model/i);

  const adjustment = createAiUnavailableAdjustment(unavailable);
  assert.equal(adjustment.action, "no_change");
  assert.match(adjustment.reason, /progress was saved/i);
});
