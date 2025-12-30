import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1766791059944 implements MigrationInterface {
  name = 'Migration1766791059944';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "price" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "packages" ALTER COLUMN "code" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "price" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "packages" ALTER COLUMN "code" SET NOT NULL`,
    );
  }
}
