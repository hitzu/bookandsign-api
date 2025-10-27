import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { AppDataSource } from './data-source';
import { TestDataSource } from './test-data-source';

export { AppDataSource, TestDataSource };

export const getTypeOrmConfig = () => {
  const dataSource =
    process.env.NODE_ENV === 'test' ? TestDataSource : AppDataSource;

  return {
    type: dataSource.options.type as 'postgres',
    host: (dataSource.options as PostgresConnectionOptions).host as string,
    port: (dataSource.options as PostgresConnectionOptions).port as number,
    username: (dataSource.options as PostgresConnectionOptions)
      .username as string,
    password: (dataSource.options as PostgresConnectionOptions)
      .password as string,
    database: (dataSource.options as PostgresConnectionOptions)
      .database as string,
    entities: dataSource.options.entities as string[],
    migrations: dataSource.options.migrations as string[],
    migrationsRun: dataSource.options.migrationsRun as boolean,
    synchronize: dataSource.options.synchronize as boolean,
    logging: (dataSource.options as PostgresConnectionOptions).logging,
    dropSchema: (dataSource.options as PostgresConnectionOptions).dropSchema,
  };
};
