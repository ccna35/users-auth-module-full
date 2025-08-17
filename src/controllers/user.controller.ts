import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../utils/http';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10), 1);
  const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize ?? '20'), 10), 1), 100);
  const { items, total } = await UserService.list(page, pageSize, String(req.query.search ?? ''), String(req.query.status ?? ''), String(req.query.role ?? ''));
  res.json({ items, total, page, pageSize });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.get(req.params.id);
  res.json({ user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.update(req.params.id, req.body);
  res.json({ user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await UserService.softDelete(req.params.id);
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const me = await UserService.get(req.user!.sub);
  res.json({ user: me });
});

export const changeMyPassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  await UserService.changePassword(req.user!.sub, currentPassword, newPassword);
  res.status(204).send();
});
