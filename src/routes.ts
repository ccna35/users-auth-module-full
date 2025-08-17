import { Router } from "express";
import { validate } from "./middleware/validate";
import { requireAuth, requireRole } from "./middleware/auth";
import { authLimiter } from "./middleware/rateLimit";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotSchema,
  resetSchema,
} from "./schemas/auth.schema";
import { updateUserSchema, changePasswordSchema } from "./schemas/user.schema";
import {
  register,
  login,
  refresh,
  logoutAll,
  forgotPassword,
  resetPassword,
} from "./controllers/auth.controller";
import {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  me,
  changeMyPassword,
} from "./controllers/user.controller";

export const routes = Router();

// Auth
routes.post("/auth/register", authLimiter, validate(registerSchema), register);
routes.post("/auth/login", authLimiter, validate(loginSchema), login);
routes.post("/auth/refresh", validate(refreshSchema), refresh);
routes.post("/auth/logout-all", requireAuth, logoutAll);
routes.post("/auth/forgot-password", validate(forgotSchema), forgotPassword);
routes.post("/auth/reset-password", validate(resetSchema), resetPassword);

// Me
routes.get("/me", requireAuth, me);
routes.patch(
  "/me/password",
  requireAuth,
  validate(changePasswordSchema),
  changeMyPassword
);

// Users (admin)
routes.get("/users", requireAuth, requireRole("ADMIN"), listUsers);
routes.get("/users/:id", requireAuth, requireRole("ADMIN"), getUser);
routes.patch(
  "/users/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate(updateUserSchema),
  updateUser
);
routes.delete("/users/:id", requireAuth, requireRole("ADMIN"), deleteUser);

export default routes;
