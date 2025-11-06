import { AppDataSource as TestDataSource } from '../src/config/database/data-source';

beforeAll(async () => {
  await TestDataSource.initialize();
});

afterAll(async () => {
  await TestDataSource.destroy();
});

afterEach(async () => {
  const entities = TestDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = TestDataSource.getRepository(entity.name);
    await repository.clear();
  }
});
