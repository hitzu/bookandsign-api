import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Brand } from './brands/entities/brand.entity';
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [Brand],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});
