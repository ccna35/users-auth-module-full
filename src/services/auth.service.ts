import { UserRepo } from "../repositories/user.repo";
import { RefreshTokenRepo, ResetTokenRepo } from "../repositories/token.repo";
import {
  hashPassword,
  verifyPassword,
  randomToken,
  sha256,
} from "../utils/crypto";
import { signAccessToken } from "../utils/jwt";
import { BadRequest, Locked, Unauthorized } from "../utils/errors";
import { env } from "../config/env";
import { LOCKOUT_THRESHOLD, LOCKOUT_WINDOW_MIN } from "../config/security";

function addToDate(from: Date, duration: string) {
  // naive duration parser (m, h, d)
  const match = duration.match(/^(\d+)([mhd])$/);
  if (!match) throw new Error("Invalid duration");
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const d = new Date(from);
  if (unit === "m") d.setMinutes(d.getMinutes() + value);
  if (unit === "h") d.setHours(d.getHours() + value);
  if (unit === "d") d.setDate(d.getDate() + value);
  return d;
}

// Helper: should we reset the failure window?
function failureWindowExpired(user: any) {
  if (!user.last_failed_login_at) return true;
  const last = new Date(user.last_failed_login_at).getTime();
  const cutoff = Date.now() - LOCKOUT_WINDOW_MIN * 60 * 1000;
  return last < cutoff;
}

// Helper: check if user is locked
function isLocked(user: any): boolean {
  return user.locked_until && new Date(user.locked_until) > new Date();
}

export const AuthService = {
  async register(input: { name: string; email: string; password: string }) {
    const existing = await UserRepo.findByEmail(input.email);
    if (existing) throw BadRequest("Email already in use");
    const password_hash = await hashPassword(input.password);
    const user = await UserRepo.create({
      name: input.name,
      email: input.email,
      password_hash,
    });
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refresh = await this.issueRefreshToken(user.id);
    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken: refresh.token,
    }; // return JSON tokens (or set cookies in controller)
  },

  async login(input: { email: string; password: string }) {
    const user = await UserRepo.findByEmail(input.email);
    if (!user) throw Unauthorized("Invalid credentials");

    // 1) Hard lock check
    if (isLocked(user)) {
      const unlockInMs = new Date(user.locked_until).getTime() - Date.now();
      const unlockInMin = Math.ceil(unlockInMs / 60000);
      throw Locked(`Account locked. Try again in ${unlockInMin} minutes.`);
    }

    if (user.status !== "ACTIVE") throw Unauthorized("User not active");
    const ok = await verifyPassword(user.password_hash, input.password);
    if (!ok) {
      await UserRepo.recordFailedLogin(user.id);

      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        throw Locked("Account locked. Try again later.");
      }

      // Remaining attempts in current window
      const remaining = Math.max(
        0,
        LOCKOUT_THRESHOLD -
          (failureWindowExpired(user) ? 0 : user.failed_logins)
      );
      throw Unauthorized(`Invalid credentials. ${remaining} attempts left.`);
    }

    // Reset failures on successful login
    await UserRepo.resetFailures(user.id);

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refresh = await this.issueRefreshToken(user.id);
    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken: refresh.token,
    };
  },

  async refresh(input: { refreshToken: string }) {
    const { refreshToken } = input;
    const hash = sha256(refreshToken);
    const row = await RefreshTokenRepo.findValidByHash(hash);
    if (!row) throw Unauthorized("Invalid refresh token");
    if (new Date(row.expires_at) < new Date()) {
      await RefreshTokenRepo.revoke(row.id);
      throw Unauthorized("Refresh token expired");
    }
    // rotate token
    await RefreshTokenRepo.revoke(row.id);
    const replacement = await this.issueRefreshToken(row.user_id);
    await RefreshTokenRepo.linkReplacement(row.id, replacement.row.id);

    const user = await UserRepo.findById(row.user_id);
    if (!user) throw Unauthorized("User not found");
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    return { accessToken, refreshToken: replacement.token };
  },

  async logoutAll(userId: string) {
    await RefreshTokenRepo.revokeAllForUser(userId);
  },

  async forgotPassword(email: string) {
    const user = await UserRepo.findByEmail(email);
    if (!user) return; // do not reveal
    const token = randomToken(32);
    const hash = sha256(token);
    const expiresAt = addToDate(new Date(), env.RESET_TOKEN_TTL);
    await ResetTokenRepo.create(user.id, hash, expiresAt);
    // Send `token` via email (out of scope). Return it for testing/local only.
    return { token }; // remove in production
  },

  async resetPassword(token: string, newPassword: string) {
    const hash = sha256(token);
    const row = await ResetTokenRepo.useIfValid(hash);
    if (!row) throw BadRequest("Invalid or expired token");
    const password_hash = await hashPassword(newPassword);
    await UserRepo.updatePassword(row.user_id, password_hash);
    await RefreshTokenRepo.revokeAllForUser(row.user_id); // log out all sessions
  },

  async issueRefreshToken(userId: string) {
    const token = randomToken(48);
    const hash = sha256(token);
    const expiresAt = addToDate(new Date(), env.REFRESH_TOKEN_TTL);
    const row = await RefreshTokenRepo.create(userId, hash, expiresAt);
    return { token, row };
  },
};

function sanitizeUser(u: any) {
  const { password_hash, ...rest } = u;
  return rest;
}
