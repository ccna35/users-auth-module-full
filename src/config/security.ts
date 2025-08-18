// src/config/security.ts
export const LOCKOUT_WINDOW_MIN = 15; // Count failures within 15 minutes
export const LOCKOUT_THRESHOLD = 5; // 5 wrong attempts → lock
export const LOCKOUT_DURATION_MIN = 15; // Lock account for 15 minutes
