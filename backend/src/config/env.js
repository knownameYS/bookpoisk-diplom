import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
  accessTtl: process.env.JWT_ACCESS_TTL || '15m',
  refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS || 30),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};
