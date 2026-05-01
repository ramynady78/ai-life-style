import { Response } from "express";
import { pool } from "../config/db";
import { AuthedRequest } from "../middleware/auth.middleware";
import {
  AiContentError,
  generateRecommendationContent,
} from "../services/ai.service";
import {
  getOllamaErrorStatus,
  getOllamaUserMessage,
} from "../services/ollama.service";
import { loadUserAiContext } from "../services/user-context.service";

export const generatePlan = async (
  req: AuthedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const context = await loadUserAiContext(userId);

    if (!context.profile) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    let content;
    try {
      content = await generateRecommendationContent(context);
    } catch (error) {
      console.error("Error generating AI recommendation:", error);
      res.status(error instanceof AiContentError ? 502 : getOllamaErrorStatus(error)).json({
        message:
          error instanceof AiContentError
            ? "Local Ollama returned a plan that could not be parsed. Try regenerating the plan."
            : getOllamaUserMessage(error),
      });
      return;
    }

    await pool.query(
      "UPDATE recommendations SET status = 'archived' WHERE user_id = $1 AND status = 'active'",
      [userId],
    );

    const versionResult = await pool.query(
      "SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM recommendations WHERE user_id = $1",
      [userId],
    );

    const version = Number(versionResult.rows[0].next_version);

    const insertResult = await pool.query(
      `INSERT INTO recommendations (user_id, version, status, content, generated_by)
       VALUES ($1, $2, 'active', $3::jsonb, 'ai')
       RETURNING id, user_id, version, status, content, generated_by, created_at`,
      [userId, version, JSON.stringify(content)],
    );

    res.status(200).json({
      plan: insertResult.rows[0].content,
      version: insertResult.rows[0].version,
    });
  } catch (error) {
    console.error("Error generating recommendation plan:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getActivePlan = async (
  req: AuthedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      `SELECT id, user_id, version, status, content, generated_by, created_at
       FROM recommendations
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "No active recommendation found" });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error getting active recommendation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
