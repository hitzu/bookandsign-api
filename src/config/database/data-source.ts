import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

const stage = process.env.NODE_ENV || 'local';

dotenv.config({ path: path.join(__dirname, '../../../', `.env.${stage}`) });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'bookandsign_dev',

  synchronize: stage === 'local',
  logging: stage === 'local' ? 'all' : ['error', 'warn'],

  entities: [path.join(__dirname, '../../**/entities/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../../database/migrations/**/*{.ts,.js}')],
  subscribers: [path.join(__dirname, '../../subscribers/**/*{.ts,.js}')],

  ssl: stage === 'prod' ? { rejectUnauthorized: false } : false,
  poolSize: stage === 'prod' ? 20 : 5,

  extra: {
    max: stage === 'prod' ? 20 : 5,
    connectionTimeoutMillis: 2000,
  },
});
