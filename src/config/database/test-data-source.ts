// src/config/database/test-data-source.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.join(__dirname, '../../../', '.env.test'),
});

export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433', 10),
  username: process.env.TEST_DB_USERNAME || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_NAME || 'bookandsign_test',

  synchronize: true, // Para tests es mejor usar synchronize
  logging: false,
  dropSchema: true,

  entities: [path.join(__dirname, '../../**/entities/*.entity{.ts,.js}')],
  migrations: [], // Vacío para tests

  poolSize: 5,
});
