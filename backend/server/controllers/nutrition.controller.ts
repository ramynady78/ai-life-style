import { Response } from "express";
import { pool } from "../config/db";
import { AuthedRequest } from "../middleware/auth.middleware";
import {
  AiContentError,
  normalizeRecommendationContent,
  type NutritionMeal,
} from "../services/ai.service";

function round(value: number): number {
  return Math.round(value);
}

export const getTodayNutrition = async (
  req: AuthedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const [profileResult, recommendationResult] = await Promise.all([
      pool.query("SELECT * FROM user_profile WHERE user_id=$1", [userId]),
      pool.query(
        `SELECT content, generated_by
         FROM recommendations
         WHERE user_id=$1 AND status='active'
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId],
      ),
    ]);

    const activeRecommendation = recommendationResult.rows[0];

    if (!activeRecommendation || activeRecommendation.generated_by !== "ai") {
      res.status(404).json({
        message: "Generate a local Ollama AI plan first to load nutrition guidance.",
      });
      return;
    }

    let content;
    try {
      content = normalizeRecommendationContent(
        activeRecommendation.content,
        profileResult.rows[0] ?? {},
      );
    } catch (error) {
      if (error instanceof AiContentError) {
        res.status(422).json({
          message: "The active AI plan is missing nutrition data. Regenerate the plan with Ollama.",
        });
        return;
      }

      throw error;
    }

    const meals = content.meals as NutritionMeal[];
    const plannedCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const calorieTarget = content.calorie_target;
    const currentLiters = Number((content.hydration_goal_liters * 0.75).toFixed(1));

    res.status(200).json({
      date: new Date().toISOString().slice(0, 10),
      calorie_target: calorieTarget,
      consumed_calories: plannedCalories > 0 ? plannedCalories : calorieTarget,
      macros: {
        protein: round(content.macro_targets.protein),
        carbs: round(content.macro_targets.carbs),
        fat: round(content.macro_targets.fat),
      },
      hydration: {
        goal_liters: content.hydration_goal_liters,
        current_liters: currentLiters,
      },
      meals,
      insights: content.insights,
    });
  } catch (error) {
    console.error("Error loading nutrition plan:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
