import { Response } from "express";
import { pool } from "../config/db";
import { AuthedRequest } from "../middleware/auth.middleware";

export const createProfile = async (
  req: AuthedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: "User ID not found in token" });
      return;
    }

    const {
      age,
      gender,
      height_cm,
      initial_weight_kg,
      goal_type,
      experience_level,
      gym_days_per_week,
      session_minutes,
      injuries,
      chronic_flags,
    } = req.body;

    if (
      age == null ||
      !gender ||
      height_cm == null ||
      initial_weight_kg == null ||
      !goal_type ||
      !experience_level
    ) {
      res.status(400).json({
        error:
          "Missing required fields: age, gender, height_cm, initial_weight_kg, goal_type, experience_level",
      });
      return;
    }

    if (gender !== "male" && gender !== "female") {
      res
        .status(400)
        .json({ error: "Invalid gender. Please specify 'male' or 'female'." });
      return;
    }

    const existingProfile = await pool.query(
      "SELECT user_id FROM user_profile WHERE user_id = $1",
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      res.status(400).json({ error: "Profile already exists for this user" });
      return;
    }

    const normalizedInjuries =
      injuries == null
        ? null
        : Array.isArray(injuries)
        ? injuries
        : [injuries];

    const normalizedChronicFlags =
      chronic_flags == null
        ? null
        : Array.isArray(chronic_flags)
        ? chronic_flags
        : [chronic_flags];

    const result = await pool.query(
      `INSERT INTO user_profile (
        user_id,
        age,
        gender,
        height_cm,
        initial_weight_kg,
        goal_type,
        experience_level,
        gym_days_per_week,
        session_minutes,
        injuries,
        chronic_flags,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, NOW())
      RETURNING *`,
      [
        userId,
        age,
        gender,
        height_cm,
        initial_weight_kg,
        goal_type,
        experience_level,
        gym_days_per_week ?? null,
        session_minutes ?? null,
        normalizedInjuries === null ? null : JSON.stringify(normalizedInjuries),
        normalizedChronicFlags === null ? null : JSON.stringify(normalizedChronicFlags),
      ]
    );

    res.status(201).json({
      message: "Profile created successfully",
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getMyProfile = async (
  req: AuthedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const result = await pool.query(
      "SELECT * FROM user_profile WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.status(200).json({
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateMyProfile = async (
  req: AuthedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: "User not found " });
      return;
    }

    const {
      age,
      gender,
      height_cm,
      initial_weight_kg,
      goal_type,
      experience_level,
      gym_days_per_week,
      session_minutes,
      injuries,
      chronic_flags,
    } = req.body;

    const existingProfile = await pool.query(
      "SELECT * FROM user_profile WHERE user_id = $1",
      [userId]
    );

    if (existingProfile.rows.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const currentProfile = existingProfile.rows[0];

    if (gender !== "male" && gender !== "female") {
      res.status(400).json({ error: "Invalid gender. Please specify 'male' or 'female'." });
      return;
    }
    const result = await pool.query(
      `UPDATE user_profile
       SET
         age = $1,
         gender = $2,
         height_cm = $3,
         initial_weight_kg = $4,
         goal_type = $5,
         experience_level = $6,
         gym_days_per_week = $7,
         session_minutes = $8,
         injuries = $9,
         chronic_flags = $10,
         updated_at = NOW()
       WHERE user_id = $11
       RETURNING *`,
      [
        age ?? currentProfile.age,
        gender ?? currentProfile.gender,
        height_cm ?? currentProfile.height_cm,
        initial_weight_kg ?? currentProfile.initial_weight_kg,
        goal_type ?? currentProfile.goal_type,
        experience_level ?? currentProfile.experience_level,
        gym_days_per_week ?? currentProfile.gym_days_per_week,
        session_minutes ?? currentProfile.session_minutes,
        injuries ?? currentProfile.injuries,
        chronic_flags ?? currentProfile.chronic_flags,
        userId,
      ]
    );

    res.status(200).json({
      message: "Profile updated successfully",
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMyProfile = async (
  req: AuthedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const existingProfile = await pool.query(
      "SELECT * FROM user_profile WHERE user_id = $1",
      [userId]
    );

    if (existingProfile.rows.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    await pool.query("DELETE FROM user_profile WHERE user_id = $1", [userId]);

    res.status(200).json({
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};