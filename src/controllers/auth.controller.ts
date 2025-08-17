import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../utils/http';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await AuthService.register(req.body);
  res.status(201).json({ user, accessToken, refreshToken });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await AuthService.login(req.body);
  res.json({ user, accessToken, refreshToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = await AuthService.refresh(req.body);
  res.json({ accessToken, refreshToken });
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.logoutAll(req.user!.sub);
  res.status(204).send();
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.forgotPassword(req.body.email);
  res.json({ ok: true, ...(result ? { token: result.token } : {}) });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body.token, req.body.password);
  res.status(204).send();
});
