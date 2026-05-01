import { pool } from "../config/db";

export type UserAiContext = {
  profile: Record<string, any> | null;
  measurements: Record<string, any>[];
  adherenceLogs: Record<string, any>[];
  activeRecommendation: Record<string, any> | null;
};

async function listRecentMeasurements(userId: string, limit: number) {
  try {
    const result = await pool.query(
      `SELECT id, user_id, measured_at, weight_kg, waist_cm, sleep_hours_avg, steps_avg, heart_rate, created_at
       FROM measurements
       WHERE user_id = $1
       ORDER BY measured_at DESC, created_at DESC
       LIMIT $2`,
      [userId, limit],
    );

    return result.rows
      .map((row) => ({ ...row, heart_rate: row.heart_rate ?? null }))
      .reverse();
  } catch (dbError: any) {
    if (dbError?.code !== "42703") {
      throw dbError;
    }

    const result = await pool.query(
      `SELECT id, user_id, measured_at, weight_kg, waist_cm, sleep_hours_avg, steps_avg, created_at
       FROM measurements
       WHERE user_id = $1
       ORDER BY measured_at DESC, created_at DESC
       LIMIT $2`,
      [userId, limit],
    );

    return result.rows.map((row) => ({ ...row, heart_rate: null })).reverse();
  }
}

async function listRecentAdherenceLogs(userId: string, limit: number) {
  const result = await pool.query(
    `SELECT id, user_id, log_date, workout_done, completion_pct, comment, created_at
     FROM adherence_logs
     WHERE user_id = $1
     ORDER BY log_date DESC, created_at DESC
     LIMIT $2`,
    [userId, limit],
  );

  return result.rows.reverse();
}

async function getActiveRecommendation(userId: string) {
  const result = await pool.query(
    `SELECT id, user_id, version, status, content, generated_by, created_at
     FROM recommendations
     WHERE user_id = $1 AND status = 'active'
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function loadUserAiContext(
  userId: string,
  options: { measurementLimit?: number; adherenceLimit?: number } = {},
): Promise<UserAiContext> {
  const measurementLimit = options.measurementLimit ?? 8;
  const adherenceLimit = options.adherenceLimit ?? 14;

  const [profileResult, measurements, adherenceLogs, activeRecommendation] = await Promise.all([
    pool.query("SELECT * FROM user_profile WHERE user_id = $1", [userId]),
    listRecentMeasurements(userId, measurementLimit),
    listRecentAdherenceLogs(userId, adherenceLimit),
    getActiveRecommendation(userId),
  ]);

  return {
    profile: profileResult.rows[0] ?? null,
    measurements,
    adherenceLogs,
    activeRecommendation,
  };
}
