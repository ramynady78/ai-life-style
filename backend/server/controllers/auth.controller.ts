import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../config/db";
import { AuthedRequest } from "../middleware/auth.middleware";
import { generateJwtToken } from "../middleware/generateJwtToken";

const BCRYPT_ROUNDS = 10;

function normalizeOptionalString(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function register(req: Request, res: Response) {
  const { first_name, last_name, username, email, password } = req.body as {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password: string;
  };

  if (!first_name || !last_name || !username || !email || !password) {
    return res.status(400).json({
      message: "First name, last name, username, email, and password required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  if (!normalizedEmail || !normalizedUsername || password.length < 8) {
    return res.status(400).json({
      message: "Provide valid email/username and a password with at least 8 characters",
    });
  }

  const existingEmail = await pool.query("SELECT id FROM users WHERE email=$1", [normalizedEmail]);
  if (existingEmail.rows.length > 0) {
    return res.status(400).json({ message: "This email already exists" });
  }

  const existingUsername = await pool.query("SELECT id FROM users WHERE username=$1", [
    normalizedUsername,
  ]);
  if (existingUsername.rows.length > 0) {
    return res.status(400).json({ message: "This username already exists" });
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = await pool.query(
    "INSERT INTO users(first_name, last_name, username, email, password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id",
    [first_name.trim(), last_name.trim(), normalizedUsername, normalizedEmail, hash],
  );

  if (result.rowCount === 0) {
    return res.status(500).json({ message: "Failed to register user" });
  }

  const token = generateJwtToken(result.rows[0].id);
  return res.status(201).json({ message: "User registered", token });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query("SELECT id, password_hash FROM users WHERE email=$1", [
    normalizedEmail,
  ]);

  if (result.rows.length === 0) {
    return res.status(400).json({ message: "This email is not registered, please sign up first" });
  }

  const ok = await bcrypt.compare(password, result.rows[0].password_hash);
  if (!ok) {
    return res.status(400).json({ message: "Incorrect password, please try again" });
  }

  const token = generateJwtToken(result.rows[0].id);
  return res.status(200).json({ token });
}

export async function logout(_req: Request, res: Response) {
  return res.status(200).json({ message: "Logged out" });
}

export async function getCurrentUser(req: AuthedRequest, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = await pool.query(
    "SELECT id, first_name, last_name, username, email, created_at FROM users WHERE id=$1",
    [userId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json(result.rows[0]);
}

export async function updateCurrentUser(req: AuthedRequest, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { first_name, last_name, username, email } = req.body as {
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
  };

  if (
    first_name === undefined &&
    last_name === undefined &&
    username === undefined &&
    email === undefined
  ) {
    return res.status(400).json({ message: "No update fields provided" });
  }

  const normalizedFirstName =
    first_name === undefined ? null : normalizeOptionalString(first_name);
  const normalizedLastName = last_name === undefined ? null : normalizeOptionalString(last_name);
  const normalizedUsername =
    username === undefined ? null : normalizeOptionalString(username)?.toLowerCase() ?? null;
  const normalizedEmail =
    email === undefined ? null : normalizeOptionalString(email)?.toLowerCase() ?? null;

  if (first_name !== undefined && !normalizedFirstName) {
    return res.status(400).json({ message: "First name cannot be empty" });
  }

  if (last_name !== undefined && !normalizedLastName) {
    return res.status(400).json({ message: "Last name cannot be empty" });
  }

  if (username !== undefined && !normalizedUsername) {
    return res.status(400).json({ message: "Username cannot be empty" });
  }

  if (email !== undefined && !normalizedEmail) {
    return res.status(400).json({ message: "Email cannot be empty" });
  }

  if (normalizedEmail) {
    const existingEmail = await pool.query("SELECT id FROM users WHERE email=$1 AND id<>$2", [
      normalizedEmail,
      userId,
    ]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ message: "This email is already in use" });
    }
  }

  if (normalizedUsername) {
    const existingUsername = await pool.query(
      "SELECT id FROM users WHERE username=$1 AND id<>$2",
      [normalizedUsername, userId],
    );
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ message: "This username is already in use" });
    }
  }

  const result = await pool.query(
    `UPDATE users
     SET
       first_name = COALESCE($1, first_name),
       last_name = COALESCE($2, last_name),
       username = COALESCE($3, username),
       email = COALESCE($4, email),
       updated_at = NOW()
     WHERE id = $5
     RETURNING id, first_name, last_name, username, email, created_at`,
    [normalizedFirstName, normalizedLastName, normalizedUsername, normalizedEmail, userId],
  );

  return res.status(200).json({
    message: "Account settings updated",
    user: result.rows[0],
  });
}

export async function changePassword(req: AuthedRequest, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current password and new password are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters" });
  }

  const result = await pool.query("SELECT password_hash FROM users WHERE id=$1", [userId]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: "User not found" });
  }

  const isValidCurrentPassword = await bcrypt.compare(
    currentPassword,
    result.rows[0].password_hash,
  );
  if (!isValidCurrentPassword) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  const nextHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await pool.query("UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2", [
    nextHash,
    userId,
  ]);

  return res.status(200).json({ message: "Password updated successfully" });
}

export async function deleteCurrentUser(req: AuthedRequest, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM adherence_logs WHERE user_id=$1", [userId]);
    await client.query("DELETE FROM measurements WHERE user_id=$1", [userId]);
    await client.query("DELETE FROM recommendations WHERE user_id=$1", [userId]);
    await client.query("DELETE FROM user_profile WHERE user_id=$1", [userId]);
    await client.query("DELETE FROM users WHERE id=$1", [userId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return res.status(200).json({ message: "Account deleted successfully" });
}
