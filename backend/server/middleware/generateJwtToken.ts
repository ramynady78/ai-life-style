import jwt from "jsonwebtoken";

export function generateJwtToken(userId: string) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "7d" });
};