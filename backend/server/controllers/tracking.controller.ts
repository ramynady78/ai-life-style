import { Response } from "express";
import { pool } from "../config/db";
import { AuthedRequest } from "../middleware/auth.middleware";
import {
  createAiUnavailableAdjustment,
  generateProgressAdjustment,
} from "../services/ai.service";
import { loadUserAiContext } from "../services/user-context.service";

function normalizeDate(value?: string): string {
  if (value) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

export const createMeasurement = async (
  req: AuthedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { measuredAt, weightKg, waistCm, sleepHoursAvg, stepsAvg, heartRate } = req.body as {
      measuredAt?: string;
      weightKg?: number | null;
      waistCm?: number | null;
      sleepHoursAvg?: number | null;
      stepsAvg?: number | null;
      heartRate?: number | null;
    };

    let result;

    try {
      result = await pool.query(
        `INSERT INTO measurements (user_id, measured_at, weight_kg, waist_cm, sleep_hours_avg, steps_avg, heart_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, user_id, measured_at, weight_kg, waist_cm, sleep_hours_avg, steps_avg, heart_rate, created_at`,
        [
          userId,
          normalizeDate(measuredAt),
          weightKg ?? null,
          waistCm ?? null,
          sleepHoursAvg ?? null,
          stepsAvg ?? null,
          heartRate ?? null,
        ],
      );
    } catch (dbError: any) {
      // Backward compatibility: some DBs may not have `heart_rate` yet.
      if (dbError?.code !== "42703") {
        throw dbError;
      }

      result = await pool.query(
        `INSERT INTO measurements (user_id, measured_at, weight_kg, waist_cm, sleep_hours_avg, steps_avg)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id, measured_at, weight_kg, waist_cm, sleep_hours_avg, steps_avg, created_at`,
        [
          userId,
          normalizeDate(measuredAt),
          weightKg ?? null,
          waistCm ?? null,
          sleepHoursAvg ?? null,
          stepsAvg ?? null,
        ],
      );
    }

    let adjustment;
    try {
      const context = await loadUserAiContext(userId);
      adjustment = await generateProgressAdjustment(context);
    } catch (error) {
      console.error("AI adjustment unavailable:", error);
      adjustment = createAiUnavailableAdjustment(error);
    }

    res.status(201).json({
      measurement: {
        ...result.rows[0],
        heart_rate: result.rows[0].heart_rate ?? null,
      },
      adjustment,
    });
  } catch (error) {
    console.error("Error creating measurement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const listMeasurements = async (
  req: AuthedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let result;
    try {
      result = await pool.query(
        `SELECT id, user_id, measured_at, weight_kg, waist_cm, sleep_hours_avg, steps_avg, heart_rate, created_at
         FROM measurements
         WHERE user_id = $1
         ORDER BY measured_at ASC, created_at ASC`,
        [userId],
      );
    } catch (dbError: any) {
      // Backward compatibility: some DBs may not have `heart_rate` yet.
      if (dbError?.code !== "42703") {
        throw dbError;
      }

      result = await pool.query(
        `SELECT id, user_id, measured_at, weight_kg, waist_cm, sleep_hours_avg, steps_avg, created_at
         FROM measurements
         WHERE user_id = $1
         ORDER BY measured_at ASC, created_at ASC`,
        [userId],
      );
    }

    res.status(200).json(
      result.rows.map((row) => ({
        ...row,
        heart_rate: row.heart_rate ?? null,
      })),
    );
  } catch (error) {
    console.error("Error listing measurements:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const listAdherenceLogs = async (
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
      `SELECT id, user_id, log_date, workout_done, completion_pct, comment, created_at
       FROM adherence_logs
       WHERE user_id = $1
       ORDER BY log_date ASC, created_at ASC`,
      [userId],
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error listing adherence logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createAdherenceLog = async (
  req: AuthedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { logDate, workoutDone, completionPct, comment } = req.body as {
      logDate?: string;
      workoutDone?: boolean;
      completionPct?: number | null;
      comment?: string | null;
    };

    const result = await pool.query(
      `INSERT INTO adherence_logs (user_id, log_date, workout_done, completion_pct, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, log_date)
       DO UPDATE SET
         workout_done = EXCLUDED.workout_done,
         completion_pct = EXCLUDED.completion_pct,
         comment = EXCLUDED.comment
       RETURNING id, user_id, log_date, workout_done, completion_pct, comment, created_at`,
      [userId, normalizeDate(logDate), workoutDone ?? false, completionPct ?? null, comment ?? null],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating adherence log:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
