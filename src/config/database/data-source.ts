import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const stage = process.env.NODE_ENV || 'local';
const isTest = stage === 'test';

// Try to load .env file if it exists, but don't fail if it doesn't
const envPath = path.join(__dirname, '../../../', `.env.${stage}`);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const url = process.env.SUPABASE_DB_URL;
const isProduction = stage === 'production' || stage === 'prod';

// When using a connection URL, TypeORM should use it instead of individual parameters
// Only provide individual parameters when URL is not available
const baseConfig = url
  ? {
      type: 'postgres' as const,
      url,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    }
  : {
      type: 'postgres' as const,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'bookandsign_dev',
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };

export const AppDataSource = new DataSource({
  ...baseConfig,
  synchronize: isTest,
  logging: false,
  dropSchema: isTest,

  entities: [path.join(__dirname, '../../**/entities/*.entity{.ts,.js}')],
  migrations: isTest
    ? []
    : [path.join(__dirname, '../../database/migrations/**/*{.ts,.js}')],
  subscribers: [path.join(__dirname, '../../subscribers/**/*{.ts,.js}')],

  poolSize: isProduction ? 20 : 5,

  extra: {
    max: isProduction ? 20 : 5,
    connectionTimeoutMillis: 2000,
  },
});
