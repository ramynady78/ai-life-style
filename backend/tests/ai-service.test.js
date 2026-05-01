const assert = require("node:assert/strict");
const test = require("node:test");

const {
  AiContentError,
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
    },
    { initial_weight_kg: 75 },
  );

  assert.equal(content.generated_by, undefined);
  assert.equal(content.calorie_target, 2100);
  assert.equal(content.macro_targets.protein, 140);
  assert.equal(content.meals[0].type, "Breakfast");
  assert.equal(content.recommendation_cards[0].category, "Workout");
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
