import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev_fallback_change_in_production';

const isFallback = !process.env.JWT_SECRET ||
  ['dev_fallback', 'dev_fallback_change_in_production', 'change_me', 'fallback', 'admin123', 'admin'].includes(process.env.JWT_SECRET.toLowerCase());

if (isFallback && process.env.NODE_ENV === 'production') {
  throw new Error('[AUTH] FATAL: A secure, custom JWT_SECRET environment variable is required in production! Cannot use default or fallback values.');
}

export function generateToken(user: { id: number | string; username: string; role?: string; workspace_id?: number }): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, workspace_id: user.workspace_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export { JWT_SECRET };
