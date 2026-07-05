import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev_fallback_change_in_production';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('[AUTH] FATAL: JWT_SECRET environment variable is required in production!');
}

export function generateToken(user: { id: number | string; username: string; role?: string }): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export { JWT_SECRET };
