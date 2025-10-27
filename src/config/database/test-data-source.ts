// src/config/database/test-data-source.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.join(__dirname, '../../../', '.env.test'),
});

export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USER || 'test_user',
  password: process.env.DB_PASS || 'test_pass',
  database: process.env.DB_NAME || 'test_db',

  synchronize: false,
  logging: false,
  dropSchema: true,

  entities: [path.join(__dirname, '../../**/entities/*.entity{.ts,.js}')],
  migrations: [],

  poolSize: 5,
});
