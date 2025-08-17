import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

// Convert "15m", "1h", "7d", "45s" → seconds (number)
function ttlToSeconds(input: string): number {
  const m = input.match(/^(\d+)([smhd])$/); // seconds/minutes/hours/days
  if (!m)
    throw new Error(
      `Invalid duration: ${input}. Use Ns|Nm|Nh|Nd (e.g., "15m").`
    );
  const n = parseInt(m[1], 10);
  const u = m[2];
  if (u === "s") return n;
  if (u === "m") return n * 60;
  if (u === "h") return n * 60 * 60;
  return n * 60 * 60 * 24; // 'd'
}

// Explicit options so TS knows the 3rd arg is SignOptions
const accessOpts: SignOptions = {
  expiresIn: ttlToSeconds(env.ACCESS_TOKEN_TTL), // ✅ number, so TS is happy
};

type AccessClaims = JwtPayload & {
  sub: string; // user id (string because BIGINT comes as string)
  role: "USER" | "ADMIN";
};

export function signAccessToken(payload: AccessClaims) {
  // Explicitly assert the secret as Secret to match the overload
  return jwt.sign(payload, env.JWT_ACCESS_SECRET as Secret, accessOpts);
}

export function verifyAccessToken(token: string): AccessClaims {
  return jwt.verify(token, env.JWT_ACCESS_SECRET as Secret) as AccessClaims;
}
