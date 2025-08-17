import { UserRepo } from '../repositories/user.repo';
import { BadRequest, NotFound } from '../utils/errors';
import { hashPassword, verifyPassword } from '../utils/crypto';

export const UserService = {
  async list(page: number, pageSize: number, search?: string, status?: string, role?: string) {
    return UserRepo.list({ page, pageSize, search, status, role });
  },

  async get(id: string) {
    const u = await UserRepo.findById(id);
    if (!u) throw NotFound('User not found');
    return sanitize(u);
  },

  async update(id: string, fields: { name?: string; email?: string; role?: 'USER' | 'ADMIN'; status?: 'ACTIVE'|'SUSPENDED'|'DELETED' }) {
    if (fields.email) {
      const lower = fields.email.toLowerCase();
      (fields as any).email = lower;
    }
    const u = await UserRepo.update(id, fields as any);
    return sanitize(u);
  },

  async softDelete(id: string) {
    await UserRepo.softDelete(id);
  },

  async changePassword(userId: string, current: string, next: string) {
    const u = await UserRepo.findById(userId);
    if (!u) throw NotFound('User not found');
    const ok = await verifyPassword(u.password_hash, current);
    if (!ok) throw BadRequest('Current password is incorrect');
    const hash = await hashPassword(next);
    await UserRepo.updatePassword(userId, hash);
  },
};

function sanitize(u: any) {
  const { password_hash, ...rest } = u;
  return rest;
}
